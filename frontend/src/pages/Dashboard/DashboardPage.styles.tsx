import { styled } from '@mui/material/styles';
import { Box, Card, CardContent, CardActionArea, Button, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WhatsthotIcon from '@mui/icons-material/Whatshot';

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
  marginBottom: 32,
});

export const GoalCard = styled(Card)({
  marginBottom: 24,
  background: 'linear-gradient(135deg, #5C6BC0 0%, #26A69A 100%)',
  color: '#fff',
});

export const GoalContent = styled(CardContent)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
});

export const GoalIcon = styled(EmojiEventsIcon)({
  fontSize: 36,
});

export const GoalTextBox = styled(Box)({
  flex: 1,
});

export const GoalCountdown = styled(Typography)({
  opacity: 0.85,
});

export const GoalButton = styled(Button)({
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.6)',
  whiteSpace: 'nowrap',
});

// StatCard sub-components
export const StatCardRoot = styled(Card)({
  height: '100%',
});

export const StatCardAction = styled(CardActionArea)({
  height: '100%',
  padding: 4,
});

export const StatContentBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

interface StatIconBoxProps {
  accentColor: string;
}

export const StatIconBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'accentColor',
})<StatIconBoxProps>(({ accentColor }) => ({
  width: 44,
  height: 44,
  borderRadius: 20,
  backgroundColor: `${accentColor}20`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: accentColor,
}));

export const StatValue = styled(Typography)({
  fontWeight: 700,
});

// Streak
export const StreakCard = styled(Card)({
  marginBottom: 32,
});

export const StreakContent = styled(CardContent)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

export const StreakIcon = styled(WhatsthotIcon)({
  color: '#FF7043',
  fontSize: 32,
});

// Quick actions
export const QuickActionsTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: 16,
});

export const QuickActionArea = styled(CardActionArea)({
  padding: 16,
});

export const QuickActionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const QuickActionTitleBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const QuickActionTitle = styled(Typography)({
  fontWeight: 600,
});

export const QuickActionDesc = styled(Typography)({
  marginTop: 4,
});
