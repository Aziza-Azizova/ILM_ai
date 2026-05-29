import { styled } from '@mui/material/styles';
import { DialogContent, DialogActions, TextField } from '@mui/material';

export const StyledDialogContent = styled(DialogContent)({
  '&.MuiDialogContent-root': {
    paddingTop: 16,
  },
});

export const GoalTextField = styled(TextField)({
  marginBottom: 16,
});

export const StyledDialogActions = styled(DialogActions)({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 16,
});
