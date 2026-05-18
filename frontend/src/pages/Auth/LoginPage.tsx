import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, TextField, Typography, Paper,
  Divider, Alert, CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.login(form);
      login(accessToken, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Welcome back to Ilm AI
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Your personal learning companion
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email" margin="normal" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth label="Password" type="password" margin="normal" required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button
            fullWidth variant="contained" type="submit" size="large"
            sx={{ mt: 2, mb: 1 }} disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign in'}
          </Button>
        </form>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button
          fullWidth variant="outlined" startIcon={<GoogleIcon />}
          onClick={authApi.googleLogin}
        >
          Continue with Google
        </Button>

        <Typography variant="body2" textAlign="center" mt={3}>
          No account?{' '}
          <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>
            Sign up free
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
