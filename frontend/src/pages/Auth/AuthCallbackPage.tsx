import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from '../../store/auth.store';

/**
 * Google OAuth lands here: /auth/callback?token=xxx
 * We extract the token and redirect to dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Decode the JWT payload to get user info (no verification needed here)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        login(token, { id: payload.sub, email: payload.email, name: '', plan: 'free' });
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress />
      <Typography mt={2} color="text.secondary">Signing you in…</Typography>
    </Box>
  );
}
