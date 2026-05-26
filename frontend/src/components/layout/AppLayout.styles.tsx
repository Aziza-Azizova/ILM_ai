import { styled } from '@mui/material/styles';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, Avatar, Paper,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const DRAWER_WIDTH = 240;

export const Root = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
});

export const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  display: 'none',
  width: DRAWER_WIDTH,
  flexShrink: 0,
  [theme.breakpoints.up('md')]: {
    display: 'block',
  },
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
  },
}));

export const LogoBox = styled(Box)({
  padding: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const LogoIcon = styled(SchoolIcon)({
  fontSize: 28,
});

export const NavList = styled(List)({
  flex: 1,
  paddingTop: 8,
});

export const NavButton = styled(ListItemButton)(({ theme }) => ({
  margin: '0 8px',
  borderRadius: 20,
  marginBottom: 4,
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '& .MuiListItemIcon-root': { color: '#fff' },
    '&:hover': { backgroundColor: theme.palette.primary.dark },
  },
}));

export const NavItemIcon = styled(ListItemIcon)({
  minWidth: 40,
});

export const UserBox = styled(Box)({
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.primary.main,
  fontSize: 14,
}));

export const UserInfoBox = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  paddingBottom: 64,
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up('md')]: {
    paddingBottom: 0,
  },
}));

export const BottomNavPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'block',
  zIndex: 10,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));
