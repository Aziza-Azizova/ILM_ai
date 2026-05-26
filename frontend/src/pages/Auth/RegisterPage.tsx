import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField, CircularProgress, Alert,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import axios from 'axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import * as S from './RegisterPage.styles';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.register(form);
      login(accessToken, user);
      navigate('/dashboard');
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Registration failed. Please try again.')
          : 'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.PageRoot>
      <S.FormCard>
        <S.PageTitle variant="h5">Start learning with Ilm AI</S.PageTitle>
        <S.PageSubtitle variant="body2" color="text.secondary">
          Upload your materials. Get a personal tutor.
        </S.PageSubtitle>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Your name" margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            fullWidth label="Email" type="email" margin="normal" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth label="Password" type="password" margin="normal" required
            helperText="Minimum 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <S.SubmitButton fullWidth variant="contained" type="submit" size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create account'}
          </S.SubmitButton>
        </form>

        <S.OrDivider>or</S.OrDivider>

        <S.SubmitButton
          fullWidth variant="outlined" startIcon={<GoogleIcon />}
          onClick={authApi.googleLogin}
          sx={{ mt: 0, mb: 0 }}
        >
          Sign up with Google
        </S.SubmitButton>

        <S.FooterText variant="body2">
          Already have an account?{' '}
          <S.FooterLink to="/login">Sign in</S.FooterLink>
        </S.FooterText>
      </S.FormCard>
    </S.PageRoot>
  );
}
