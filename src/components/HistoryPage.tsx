import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
} from '@mui/material';
import { Delete, Edit, FileDownload, FileUpload, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useAppStore } from '../store';
import type { TicketRecord } from '../types';
import { fetchDrawResult, compareNumbers } from '../utils/results';
import type { DrawResult, ComparisonResult } from '../types';
import NumberBall from './NumberBall';

export default function HistoryPage() {
  const { t } = useTranslation();
  const { showSnackbar } = useAppStore();
  const records = useLiveQuery(() => db.tickets.orderBy('uploadDate').reverse().toArray()) ?? [];
  const [editRecord, setEditRecord] = useState<TicketRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resultMap, setResultMap] = useState<Record<number, { result: DrawResult; comparison: ComparisonResult }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async () => {
    if (deleteId !== null) {
      await db.tickets.delete(deleteId);
      setDeleteId(null);
    }
  };

  const handleEditSave = async () => {
    if (editRecord?.id) {
      await db.tickets.update(editRecord.id, {
        drawNumber: editRecord.drawNumber,
        numbers: editRecord.numbers,
        units: editRecord.units,
        amount: editRecord.amount,
        userNote: editRecord.userNote,
      });
      setEditOpen(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(records, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marksix-records-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: TicketRecord[] = JSON.parse(text);
      for (const record of data) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...rest } = record;
        await db.tickets.add(rest);
      }
      showSnackbar(t('history.imported'));
    } catch {
      showSnackbar(t('common.error'), 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCheckResult = async (record: TicketRecord) => {
    if (!record.id || !record.drawNumber) return;
    try {
      const result = await fetchDrawResult(record.drawNumber);
      if (result) {
        const comparison = compareNumbers(record.numbers, result);
        setResultMap((prev) => ({ ...prev, [record.id!]: { result, comparison } }));
      } else {
        showSnackbar(t('results.notFound'), 'error');
      }
    } catch {
      showSnackbar(t('results.networkError'), 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          {t('history.title')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<FileDownload />}
            onClick={handleExport}
            disabled={records.length === 0}
          >
            {t('history.exportJson')}
          </Button>
          <Button size="small" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()}>
            {t('history.importJson')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </Stack>
      </Box>

      {records.length === 0 && (
        <Alert severity="info">{t('history.noRecords')}</Alert>
      )}

      <Stack spacing={2}>
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('fields.drawNumber')}: {record.drawNumber || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(record.uploadDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {record.numbers.map((n, i) => (
                  <NumberBall
                    key={`${record.id}-${i}`}
                    number={n}
                    size={32}
                    matched={
                      record.id !== undefined &&
                      resultMap[record.id]?.comparison.matchedNumbers.includes(n)
                    }
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('fields.units')}: {record.units} | {t('fields.amount')}: ${record.amount}
              </Typography>
              {record.userNote && (
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  {record.userNote}
                </Typography>
              )}
              {record.id !== undefined && resultMap[record.id] && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={
                      resultMap[record.id].comparison.prizeCategory
                        ? t(resultMap[record.id].comparison.prizeCategory!)
                        : t('results.noMatch')
                    }
                    color={resultMap[record.id].comparison.prizeCategory ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
            <CardActions>
              <IconButton
                size="small"
                onClick={() => {
                  setEditRecord({ ...record });
                  setEditOpen(true);
                }}
                aria-label={t('history.edit')}
              >
                <Edit />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteId(record.id!)}
                aria-label={t('history.delete')}
                color="error"
              >
                <Delete />
              </IconButton>
              <Button
                size="small"
                startIcon={<Search />}
                onClick={() => handleCheckResult(record)}
                disabled={!record.drawNumber}
              >
                {t('results.fetch')}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t('history.confirmDelete')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error">
            {t('history.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('history.edit')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('fields.drawNumber')}
              value={editRecord?.drawNumber || ''}
              onChange={(e) =>
                setEditRecord((prev) => (prev ? { ...prev, drawNumber: e.target.value } : prev))
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t('fields.numbers')}
              value={editRecord?.numbers.join(', ') || ''}
              onChange={(e) =>
                setEditRecord((prev) =>
                  prev
                    ? {
                        ...prev,
                        numbers: e.target.value
                          .split(/[,\s]+/)
                          .map((n) => parseInt(n.trim(), 10))
                          .filter((n) => !isNaN(n)),
                      }
                    : prev,
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t('fields.units')}
              type="number"
              value={editRecord?.units || 1}
              onChange={(e) =>
                setEditRecord((prev) =>
                  prev ? { ...prev, units: parseInt(e.target.value, 10) || 1 } : prev,
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t('fields.amount')}
              type="number"
              value={editRecord?.amount || 0}
              onChange={(e) =>
                setEditRecord((prev) =>
                  prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : prev,
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t('fields.note')}
              value={editRecord?.userNote || ''}
              onChange={(e) =>
                setEditRecord((prev) => (prev ? { ...prev, userNote: e.target.value } : prev))
              }
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleEditSave} variant="contained">
            {t('upload.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
