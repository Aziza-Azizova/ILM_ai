import { useState } from 'react';
import { Dialog, DialogTitle, Button, CircularProgress, TextField } from '@mui/material';
import { usersApi } from '../../api/users.api';
import type { UserProfile } from '../../api/users.api';
import * as S from './GoalDialog.styles';

interface Props {
  open: boolean;
  currentGoal: string;
  currentDate: string;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
}

export default function GoalDialog({ open, currentGoal, currentDate, onClose, onSaved }: Props) {
  const [goalText, setGoalText] = useState(currentGoal);
  const [goalDate, setGoalDate] = useState(currentDate ? currentDate.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateGoal({ goalText, goalDate });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set your learning goal</DialogTitle>
      <S.StyledDialogContent>
        <S.GoalTextField
          fullWidth label="What are you working towards?"
          placeholder="e.g. Pass my AWS Solutions Architect exam"
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          multiline rows={2}
        />
        <TextField
          fullWidth label="Target date"
          type="date"
          value={goalDate}
          onChange={(e) => setGoalDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="When do you need to achieve this by?"
        />
      </S.StyledDialogContent>
      <S.StyledDialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !goalText.trim()}>
          {saving ? <CircularProgress size={20} /> : 'Save goal'}
        </Button>
      </S.StyledDialogActions>
    </Dialog>
  );
}
