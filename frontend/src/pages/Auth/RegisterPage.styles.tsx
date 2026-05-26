import { styled } from '@mui/material/styles';
import { Box, Paper, Typography, Button, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

export const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
}));

export const FormCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 420,
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(1),
}));

export const PageSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

export const OrDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const FooterText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(3),
}));

export const FooterLink = styled(Link)({
  color: 'inherit',
  fontWeight: 600,
});
