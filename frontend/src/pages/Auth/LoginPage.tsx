import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField, CircularProgress, Alert,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import axios from 'axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import * as S from './LoginPage.styles';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
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
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Login failed. Check your credentials.')
          : 'Login failed. Check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.PageRoot>
      <S.FormCard>
        <S.PageTitle variant="h5">Welcome back to Ilm AI</S.PageTitle>
        <S.PageSubtitle variant="body2" color="text.secondary">
          Your personal learning companion
        </S.PageSubtitle>

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
          <S.SubmitButton fullWidth variant="contained" type="submit" size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sign in'}
          </S.SubmitButton>
        </form>

        <S.OrDivider>or</S.OrDivider>

        <S.SubmitButton
          fullWidth variant="outlined" startIcon={<GoogleIcon />}
          onClick={authApi.googleLogin}
          sx={{ mt: 0, mb: 0 }}
        >
          Continue with Google
        </S.SubmitButton>

        <S.FooterText variant="body2">
          No account?{' '}
          <S.FooterLink to="/register">Sign up free</S.FooterLink>
        </S.FooterText>
      </S.FormCard>
    </S.PageRoot>
  );
}
