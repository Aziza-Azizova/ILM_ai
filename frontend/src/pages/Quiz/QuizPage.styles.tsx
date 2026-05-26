import { styled } from '@mui/material/styles';
import { Box, Card, CardContent, Typography, Avatar, FormControlLabel, Stack } from '@mui/material';

// ── Shared page root with configurable maxWidth ──────────────────────────────

interface PageRootProps {
  pageMaxWidth?: number;
}

export const PageRoot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'pageMaxWidth',
})<PageRootProps>(({ theme, pageMaxWidth = 640 }) => ({
  padding: 16,
  maxWidth: pageMaxWidth,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  [theme.breakpoints.up('md')]: {
    padding: 32,
  },
}));

// ── History tab ──────────────────────────────────────────────────────────────

export const HistoryBackButton = styled(Box)({
  marginBottom: 24,
});

export const HistoryTitle = styled(Typography)({
  fontWeight: 700,
  marginBottom: 24,
});

export const HistoryEmptyContent = styled(CardContent)({
  textAlign: 'center',
  paddingTop: 48,
  paddingBottom: 48,
});

export const HistoryEntryContent = styled(CardContent)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
});

interface HistoryAvatarProps {
  score: number;
}

export const HistoryAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'score',
})<HistoryAvatarProps>(({ theme, score }) => ({
  backgroundColor:
    score >= 80 ? theme.palette.success.main
    : score >= 50 ? theme.palette.warning.main
    : theme.palette.error.main,
  fontWeight: 700,
}));

export const HistoryScoreBox = styled(Box)({
  flex: 1,
});

export const HistoryScoreTitle = styled(Typography)({
  fontWeight: 600,
});

// ── Setup ────────────────────────────────────────────────────────────────────

export const SetupHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 32,
});

export const SetupTitle = styled(Typography)({
  fontWeight: 700,
});

export const SetupSubtitle = styled(Typography)({
  marginTop: 4,
});

export const SetupSettingsCard = styled(Card)({
  marginBottom: 24,
});

export const DifficultyLabel = styled(Typography)({
  fontWeight: 600,
  marginBottom: 12,
});

export const DifficultyStack = styled(Stack)({
  marginBottom: 24,
});

interface DifficultyCardProps {
  isSelected?: boolean;
}

export const DifficultyCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<DifficultyCardProps>(({ theme, isSelected }) => ({
  flex: 1,
  cursor: 'pointer',
  border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
  transition: 'border-color 0.15s',
  '&:hover': { borderColor: theme.palette.primary.light },
}));

export const DifficultyCardContent = styled(CardContent)({
  padding: '12px !important',
  textAlign: 'center',
});

export const QuestionCountLabel = styled(Typography)({
  fontWeight: 600,
  marginBottom: 8,
});

// ── Generating ───────────────────────────────────────────────────────────────

export const CenteredLoader = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  gap: 24,
});

// ── Question ─────────────────────────────────────────────────────────────────

export const QuestionHeader = styled(Box)({
  marginBottom: 24,
});

export const QuestionProgressRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
});

export const QuestionCard = styled(Card)({
  marginBottom: 24,
});

export const QuestionText = styled(Typography)({
  fontWeight: 600,
  marginBottom: 24,
  lineHeight: 1.6,
});

export type OptionState = 'default' | 'correct' | 'incorrect';

export const AnswerOption = styled(FormControlLabel, {
  shouldForwardProp: (prop) => prop !== 'optionState',
})<{ optionState: OptionState }>(({ theme, optionState }) => ({
  marginBottom: 8,
  paddingLeft: 12,
  paddingRight: 12,
  borderRadius: 20,
  border: '1px solid',
  borderColor:
    optionState === 'correct' ? theme.palette.success.main
    : optionState === 'incorrect' ? theme.palette.error.main
    : theme.palette.divider,
  backgroundColor:
    optionState === 'correct' ? `${theme.palette.success.main}0d`
    : optionState === 'incorrect' ? `${theme.palette.error.main}0d`
    : 'transparent',
  transition: 'all 0.15s',
}));

interface FeedbackCardProps {
  isCorrect: boolean;
}

export const FeedbackCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isCorrect',
})<FeedbackCardProps>(({ theme, isCorrect }) => ({
  marginBottom: 24,
  border: `2px solid ${isCorrect ? theme.palette.success.main : theme.palette.error.main}`,
}));

export const FeedbackHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
});

interface FeedbackTitleProps {
  isCorrect: boolean;
}

export const FeedbackTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isCorrect',
})<FeedbackTitleProps>(({ theme, isCorrect }) => ({
  fontWeight: 700,
  color: isCorrect ? theme.palette.success.dark : theme.palette.error.dark,
}));

// ── Results ───────────────────────────────────────────────────────────────────

export const ResultsTitle = styled(Typography)({
  fontWeight: 700,
  marginBottom: 4,
});

export const ResultsSubtitle = styled(Typography)({
  marginBottom: 32,
});

export const ResultsScoreCard = styled(Card)({
  marginBottom: 32,
  textAlign: 'center',
  padding: 24,
});

export type ScoreColor = 'success' | 'warning' | 'error';

export const ScoreAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'scoreColor',
})<{ scoreColor: ScoreColor }>(({ theme, scoreColor }) => ({
  width: 80,
  height: 80,
  backgroundColor: theme.palette[scoreColor].main,
  fontSize: 26,
  fontWeight: 700,
  marginLeft: 'auto',
  marginRight: 'auto',
  marginBottom: 16,
}));

export const ResultsScoreText = styled(Typography)({
  fontWeight: 700,
});

export const ResultsScoreDetail = styled(Typography)({
  marginTop: 4,
});

export const ResultsChipBox = styled(Box)({
  marginTop: 16,
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
});

export const ReviewTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: 16,
});

export const ReviewStack = styled(Stack)({
  marginBottom: 32,
});

export type AnswerStatus = 'correct' | 'incorrect' | 'unanswered';

export const ReviewCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'answerStatus',
})<{ answerStatus: AnswerStatus }>(({ theme, answerStatus }) => ({
  border: `1px solid ${
    answerStatus === 'correct' ? theme.palette.success.main
    : answerStatus === 'incorrect' ? theme.palette.error.main
    : theme.palette.divider
  }`,
}));

export const ReviewCardContent = styled(CardContent)({
  paddingBottom: '12px !important',
});

export const ReviewRow = styled(Box)({
  display: 'flex',
  gap: 12,
});

export const ReviewIconBox = styled(Box)({
  paddingTop: 3,
});

export const ReviewAnswerBox = styled(Box)({
  flex: 1,
});

export const ReviewQuestionText = styled(Typography)({
  fontWeight: 600,
});

export const ReviewUserAnswer = styled(Typography)({
  display: 'block',
});

export const ReviewCorrectAnswer = styled(Typography)({
  display: 'block',
});
