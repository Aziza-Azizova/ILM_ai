import { styled } from '@mui/material/styles';
import { Box, Typography, DialogContent, DialogActions } from '@mui/material';

export const PageRoot = styled(Box)(({ theme }) => ({
  padding: 16,
  maxWidth: 960,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  [theme.breakpoints.up('md')]: {
    padding: 32,
  },
}));

export const PageHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 32,
});

export const DescriptionText = styled(Typography)({
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const StyledDialogContent = styled(DialogContent)({
  paddingTop: 16,
});

export const StyledDialogActions = styled(DialogActions)({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 16,
});
