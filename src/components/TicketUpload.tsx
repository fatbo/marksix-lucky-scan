import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  LinearProgress,
  Paper,
  Chip,
  Alert,
  Card,
  CardContent,
  Stack,
  Collapse,
} from '@mui/material';
import { CloudUpload, Save, Search, Refresh } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { performOCR, type OcrResult } from '../utils/ocr';
import { fetchDrawResult, compareNumbers } from '../utils/results';
import { db } from '../db';
import { useAppStore } from '../store';
import type { TicketRecord, DrawResult, ComparisonResult } from '../types';
import NumberBall from './NumberBall';

export default function TicketUpload() {
  const { t } = useTranslation();
  const { showSnackbar } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrDone, setOcrDone] = useState(false);
  const [rawText, setRawText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  // Form fields
  const [drawNumber, setDrawNumber] = useState('');
  const [numbers, setNumbers] = useState('');
  const [units, setUnits] = useState('1');
  const [amount, setAmount] = useState('10');
  const [note, setNote] = useState('');

  // Result checking
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [fetchingResult, setFetchingResult] = useState(false);
  const [resultError, setResultError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setScanning(true);
    setOcrDone(false);
    setProgress(0);
    setDrawResult(null);
    setComparison(null);
    setResultError('');

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const result: OcrResult = await performOCR(file, setProgress);
      setDrawNumber(result.drawNumber);
      setNumbers(result.numbers.join(', '));
      setUnits(String(result.units));
      setAmount(String(result.amount));
      setRawText(result.rawText);
      setConfidence(result.confidence);
      setOcrDone(true);
    } catch {
      showSnackbar(t('common.error'), 'error');
    } finally {
      setScanning(false);
    }
  }, [showSnackbar, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
  });

  const handleSave = async () => {
    const numArray = numbers
      .split(/[,\s]+/)
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 49);

    const record: TicketRecord = {
      drawNumber,
      numbers: numArray,
      units: parseInt(units, 10) || 1,
      amount: parseFloat(amount) || 0,
      uploadDate: new Date().toISOString(),
      userNote: note || undefined,
      thumbnailDataURL: preview || undefined,
    };

    await db.tickets.add(record);
    showSnackbar(t('upload.saved'));
  };

  const handleCheckResults = async () => {
    if (!drawNumber) return;
    setFetchingResult(true);
    setResultError('');
    setDrawResult(null);
    setComparison(null);

    try {
      const result = await fetchDrawResult(drawNumber);
      if (result) {
        setDrawResult(result);
        const numArray = numbers
          .split(/[,\s]+/)
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));
        const comp = compareNumbers(numArray, result);
        setComparison(comp);
      } else {
        setResultError(t('results.notFound'));
      }
    } catch {
      setResultError(t('results.networkError'));
    } finally {
      setFetchingResult(false);
    }
  };

  const handleRescan = () => {
    setOcrDone(false);
    setScanning(false);
    setPreview(null);
    setDrawNumber('');
    setNumbers('');
    setUnits('1');
    setAmount('10');
    setNote('');
    setRawText('');
    setConfidence(0);
    setDrawResult(null);
    setComparison(null);
    setResultError('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {t('upload.title')}
      </Typography>

      {!ocrDone && !scanning && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: isDragActive ? 'secondary.main' : 'divider',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'secondary.main' },
          }}
        >
          <input {...getInputProps()} aria-label={t('upload.dropzone')} />
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">{t('upload.dropzone')}</Typography>
        </Paper>
      )}

      {scanning && (
        <Box sx={{ mt: 2 }}>
          <Typography>{t('upload.scanning')}</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary">
            {progress}%
          </Typography>
        </Box>
      )}

      <Collapse in={ocrDone}>
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('upload.scanComplete')} — {confidence.toFixed(0)}% confidence
          </Alert>

          {preview && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                src={preview}
                alt="Ticket preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
            </Box>
          )}

          <Stack spacing={2}>
            <TextField
              label={t('fields.drawNumber')}
              value={drawNumber}
              onChange={(e) => setDrawNumber(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t('fields.numbers')}
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              fullWidth
              size="small"
              helperText="e.g. 1, 12, 23, 34, 45, 49"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('fields.units')}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label={t('fields.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label={t('fields.note')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>

          {rawText && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Raw OCR text:
              </Typography>
              <Paper sx={{ p: 1, maxHeight: 100, overflow: 'auto', fontSize: 12 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{rawText}</pre>
              </Paper>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
              {t('upload.save')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={handleCheckResults}
              disabled={!drawNumber || fetchingResult}
            >
              {fetchingResult ? t('results.fetching') : t('results.fetch')}
            </Button>
            <Button variant="text" startIcon={<Refresh />} onClick={handleRescan}>
              {t('upload.rescan')}
            </Button>
          </Stack>

          {/* Result display */}
          {resultError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {resultError}
              <Typography variant="caption" display="block">
                {t('results.corsWarning')}
              </Typography>
            </Alert>
          )}

          {drawResult && comparison && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6">{t('results.title')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('results.drawDate')}: {drawResult.drawDate}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {t('results.winningNumbers')}:
                  </Typography>
                  {drawResult.winningNumbers.map((n) => (
                    <NumberBall
                      key={n}
                      number={n}
                      matched={comparison.matchedNumbers.includes(n)}
                    />
                  ))}
                  <Chip label="+" size="small" />
                  <NumberBall
                    number={drawResult.extraNumber}
                    isExtra
                    matched={comparison.extraMatched}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography>
                    {t('results.matches')}: {comparison.matchedNumbers.length}
                    {comparison.extraMatched ? ' + extra' : ''}
                  </Typography>
                  <Typography
                    variant="h6"
                    color={comparison.prizeCategory ? 'success.main' : 'text.secondary'}
                    fontWeight="bold"
                  >
                    {comparison.prizeCategory
                      ? t(comparison.prizeCategory)
                      : t('results.noMatch')}
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('results.disclaimer')}
                </Alert>
              </CardContent>
            </Card>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
