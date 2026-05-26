import { styled, alpha } from '@mui/material/styles';
import { Box, Paper, Avatar, IconButton, Button, List, ListItemButton, Typography } from '@mui/material';

const SIDEBAR_WIDTH = 260;

// ── Source citations ──────────────────────────────────────────────────────────

export const SourcesToggleButton = styled(Button)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.text.secondary,
  padding: 0,
  minWidth: 0,
}));

export const SourcesList = styled(Box)({
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const SourcePaper = styled(Paper)({
  padding: 12,
  borderRadius: 20,
});

// ── Message bubble ────────────────────────────────────────────────────────────

interface IsUserProp {
  isUser?: boolean;
}

export const MessageWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<IsUserProp>(({ isUser }) => ({
  display: 'flex',
  flexDirection: isUser ? 'row-reverse' : 'row',
  gap: 12,
  marginBottom: 16,
  alignItems: 'flex-start',
}));

export const MessageAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<IsUserProp>(({ theme, isUser }) => ({
  width: 32,
  height: 32,
  flexShrink: 0,
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
}));

export const MessageContentBox = styled(Box)({
  maxWidth: '75%',
});

export const MessagePaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<IsUserProp>(({ theme, isUser }) => ({
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,
  borderRadius: 30,
  borderTopRightRadius: isUser ? 4 : 30,
  borderTopLeftRadius: isUser ? 30 : 4,
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
  color: isUser ? '#fff' : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
}));

export const BlinkCursor = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: 8,
  height: 14,
  backgroundColor: theme.palette.secondary.main,
  marginLeft: 4,
  borderRadius: 5,
  animation: 'blink 1s step-end infinite',
  '@keyframes blink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0 },
  },
}));

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarContainerProps {
  isOpen?: boolean;
}

export const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<SidebarContainerProps>(({ theme, isOpen }) => ({
  display: isOpen ? 'flex' : 'none',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

export const SidebarPanel = styled(Box)(({ theme }) => ({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  height: '100%',
}));

export const SidebarHeader = styled(Box)({
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const ConversationsTitle = styled(Typography)({
  fontWeight: 700,
});

export const SidebarEmptyBox = styled(Box)({
  padding: 16,
  textAlign: 'center',
});

export const SessionList = styled(List)({
  flex: 1,
  overflowY: 'auto',
  paddingTop: 0,
  paddingBottom: 0,
});

export const SessionButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 0,
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
  },
}));

// ── Chat area ─────────────────────────────────────────────────────────────────

export const ChatRoot = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
});

export const ChatArea = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const TopBar = styled(Box)(({ theme }) => ({
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const MenuToggle = styled(IconButton)(({ theme }) => ({
  display: 'block',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const TopBarTitleBox = styled(Box)({
  flex: 1,
});

export const TopBarTitle = styled(Typography)({
  fontWeight: 700,
  lineHeight: 1.2,
});

export const MessagesArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: 16,
  [theme.breakpoints.up('md')]: {
    padding: 24,
  },
}));

export const EmptyStateBox = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: 16,
});

export const InputArea = styled(Box)(({ theme }) => ({
  padding: 16,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

export const InputRow = styled(Box)({
  display: 'flex',
  gap: 8,
  alignItems: 'flex-end',
});

export const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  '&:hover': { backgroundColor: theme.palette.primary.dark },
  '&.Mui-disabled': { backgroundColor: theme.palette.action.disabledBackground },
}));

export const NewSessionDialogContent = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));
