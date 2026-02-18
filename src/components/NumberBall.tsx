import { Box, Typography } from '@mui/material';

interface NumberBallProps {
  number: number;
  matched?: boolean;
  isExtra?: boolean;
  size?: number;
}

export default function NumberBall({ number, matched, isExtra, size = 40 }: NumberBallProps) {
  const getBgColor = () => {
    if (matched) return '#4CAF50';
    if (isExtra) return '#FFD700';
    return '#003366';
  };

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: getBgColor(),
        border: matched ? '3px solid #FFD700' : isExtra ? '3px solid #F44336' : 'none',
        boxShadow: matched ? '0 0 8px rgba(255,215,0,0.6)' : 1,
      }}
    >
      <Typography
        sx={{
          color: isExtra && !matched ? '#003366' : '#fff',
          fontWeight: 'bold',
          fontSize: size * 0.4,
        }}
      >
        {number}
      </Typography>
    </Box>
  );
}
