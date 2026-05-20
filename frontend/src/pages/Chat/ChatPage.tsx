import { Box, Typography, Card } from '@mui/material';
import { Chat } from '@mui/icons-material';

export default function ChatPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960, mx: 'auto', width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>AI Learning Companion</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Chat with your uploaded materials — coming in Week 2
      </Typography>
      <Card sx={{ textAlign: 'center', py: 8 }}>
        <Chat sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Chat is being built</Typography>
        <Typography color="text.disabled" sx={{ mt: 1 }}>
          Upload materials in Topics first, then come back here to ask questions.
        </Typography>
      </Card>
    </Box>
  );
}
