import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAuthStore } from './store/auth.store';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TopicsPage from './pages/Topics/TopicsPage';
import TopicDetailPage from './pages/Topics/TopicDetailPage';
import ChatPage from './pages/Chat/ChatPage';
import QuizPage from './pages/Quiz/QuizPage';
import ProfilePage from './pages/Profile/ProfilePage';

const theme = createTheme({
  palette: {
    primary: { main: '#5C6BC0' },
    secondary: { main: '#26A69A' },
    background: { default: '#F5F5F5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 10 },
});

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected — all share the AppLayout sidebar */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:id" element={<TopicDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
