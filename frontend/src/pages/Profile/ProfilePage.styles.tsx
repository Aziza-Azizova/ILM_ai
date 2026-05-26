import { styled } from '@mui/material/styles';
import { Box, Card, CardContent, Typography, Avatar, Chip, Divider, TextField } from '@mui/material';

export const PageRoot = styled(Box)(({ theme }) => ({
  padding: 16,
  maxWidth: 640,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  [theme.breakpoints.up('md')]: {
    padding: 32,
  },
}));

export const PageTitle = styled(Typography)({
  fontWeight: 700,
  marginBottom: 32,
});

export const ProfileCard = styled(Card)({
  marginBottom: 24,
});

export const AvatarCardContent = styled(CardContent)({
  display: 'flex',
  alignItems: 'center',
  gap: 24,
});

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primary.main,
  fontSize: 28,
}));

export const DisplayName = styled(Typography)({
  fontWeight: 600,
});

export const PlanChip = styled(Chip)({
  marginTop: 4,
});

export const SectionTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: 16,
});

export const NameTextField = styled(TextField)({
  marginBottom: 16,
});

export const GoalSectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
});

export const TargetDate = styled(Typography)({
  marginTop: 4,
});

export const SectionDivider = styled(Divider)({
  marginTop: 24,
  marginBottom: 24,
});
