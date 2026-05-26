import type { ReactNode } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ListItem, ListItemText,
  Typography, Divider, BottomNavigation, BottomNavigationAction,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FolderOpen as TopicsIcon,
  Chat as ChatIcon,
  Quiz as QuizIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/auth.store';
import * as S from './AppLayout.styles';

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'My Topics', icon: <TopicsIcon />, path: '/topics' },
  { label: 'Chat', icon: <ChatIcon />, path: '/chat' },
  { label: 'Quiz', icon: <QuizIcon />, path: '/quiz' },
  { label: 'Profile', icon: <ProfileIcon />, path: '/profile' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();

  const currentIndex = navItems.findIndex((n) => pathname.startsWith(n.path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <S.Root>
      {/* ── Sidebar (desktop) ── */}
      <S.SidebarDrawer variant="permanent">
        {/* Logo */}
        <S.LogoBox>
          <S.LogoIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary">
            Ilm AI
          </Typography>
        </S.LogoBox>

        <Divider />

        {/* Nav links */}
        <S.NavList>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.path);
            return (
              <ListItem key={item.path} disablePadding>
                <S.NavButton onClick={() => navigate(item.path)} selected={active}>
                  <S.NavItemIcon>{item.icon}</S.NavItemIcon>
                  <ListItemText primary={item.label} />
                </S.NavButton>
              </ListItem>
            );
          })}
        </S.NavList>

        <Divider />

        {/* User + logout */}
        <S.UserBox>
          <S.UserAvatar>
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
          </S.UserAvatar>
          <S.UserInfoBox>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user?.name || 'Learner'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.plan === 'premium' ? '⭐ Premium' : 'Free plan'}
            </Typography>
          </S.UserInfoBox>
          <S.NavButton
            onClick={handleLogout}
            sx={{ mx: 0, mb: 0, minWidth: 0, borderRadius: '50%', p: '6px' }}
          >
            <LogoutIcon fontSize="small" />
          </S.NavButton>
        </S.UserBox>
      </S.SidebarDrawer>

      {/* ── Main content ── */}
      <S.MainContent>
        <Outlet />
      </S.MainContent>

      {/* ── Bottom navigation (mobile) ── */}
      <S.BottomNavPaper elevation={3}>
        <BottomNavigation
          value={currentIndex === -1 ? 0 : currentIndex}
          onChange={(_, v) => navigate(navItems[v].path)}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </S.BottomNavPaper>
    </S.Root>
  );
}
