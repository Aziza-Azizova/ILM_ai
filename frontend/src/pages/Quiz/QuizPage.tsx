import { Box, Typography, Card } from '@mui/material';
import { Quiz } from '@mui/icons-material';

export default function QuizPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960, mx: 'auto', width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Quiz & Practice</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Test your knowledge — coming in Week 2
      </Typography>
      <Card sx={{ textAlign: 'center', py: 8 }}>
        <Quiz sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Quiz mode is being built</Typography>
        <Typography color="text.disabled" sx={{ mt: 1 }}>
          Upload your materials first, then quiz yourself here.
        </Typography>
      </Card>
    </Box>
  );
}
