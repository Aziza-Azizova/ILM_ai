import { styled } from '@mui/material/styles';
import { Box, Card, CardContent, Typography, Stack, LinearProgress, DialogContent, DialogActions, TextField } from '@mui/material';

export const PageRoot = styled(Box)(({ theme }) => ({
  padding: 16,
  maxWidth: 800,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  [theme.breakpoints.up('md')]: {
    padding: 32,
  },
}));

export const BackButton = styled('div')({
  marginBottom: 16,
});

export const PageHeader = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 32,
  flexWrap: 'wrap',
  gap: 16,
});

export const UploadCaption = styled(Typography)({
  marginTop: 4,
  textAlign: 'center',
  display: 'block',
});

export const EmptyStateCard = styled(Card)({
  textAlign: 'center',
  paddingTop: 64,
  paddingBottom: 64,
});

export const EmptyActionsRow = styled(Stack)({
  justifyContent: 'center',
});

export const DocCardContent = styled(CardContent)({
  paddingBottom: '12px !important',
});

export const DocMainRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

export const DocInfoBox = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export const DocChipRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
  flexWrap: 'wrap',
});

export const DocActionsBox = styled(Box)({
  display: 'flex',
  gap: 4,
});

export const StyledLinearProgress = styled(LinearProgress)({
  marginTop: 8,
  borderRadius: 10,
});

export const StyledDialogContent = styled(DialogContent)({
  paddingTop: 16,
});

export const TextTitleField = styled(TextField)({
  marginBottom: 16,
});

export const StyledDialogActions = styled(DialogActions)({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 16,
});
