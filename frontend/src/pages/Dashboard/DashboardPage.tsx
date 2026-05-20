import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Button, Skeleton, Alert,
} from '@mui/material';
import {
  FolderOpen, Chat, Quiz, TrendingUp, Whatshot,
  EmojiEvents, Add, ArrowForward,
} from '@mui/icons-material';
import { usersApi } from '../../api/users.api';
import type { UserStats, UserProfile } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import GoalDialog from './GoalDialog';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 0.5 }} disabled={!onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: `${color}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color,
            }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.getStats(), usersApi.getProfile()])
      .then(([s, p]) => { setStats(s); setProfile(p); })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const daysUntilGoal = profile?.goalDate
    ? Math.max(0, Math.ceil((new Date(profile.goalDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Here's what's happening with your learning
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Goal banner */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #5C6BC0 0%, #26A69A 100%)', color: 'white' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <EmojiEvents sx={{ fontSize: 36 }} />
          <Box sx={{ flex: 1 }}>
            {profile?.goalText ? (
              <>
                <Typography sx={{ fontWeight: 600 }}>{profile.goalText}</Typography>
                {daysUntilGoal !== null && (
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    {daysUntilGoal === 0 ? '🎯 Goal day is today!' : `${daysUntilGoal} days to go`}
                  </Typography>
                )}
              </>
            ) : (
              <Typography sx={{ fontWeight: 600 }}>No goal set yet — what are you working towards?</Typography>
            )}
          </Box>
          <Button
            variant="outlined" size="small"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}
            onClick={() => setGoalOpen(true)}
          >
            {profile?.goalText ? 'Edit goal' : 'Set goal'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats grid — MUI v9: use size prop instead of item+xs/md */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 6, md: 3 }}>
                <Skeleton variant="rounded" height={90} />
              </Grid>
            ))
          : (
            <>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Topics" value={stats?.topicsCount ?? 0}
                  icon={<FolderOpen />} color="#5C6BC0" onClick={() => navigate('/topics')} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Documents" value={stats?.documentsCount ?? 0}
                  icon={<TrendingUp />} color="#26A69A" onClick={() => navigate('/topics')} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Chats" value={stats?.chatSessionsCount ?? 0}
                  icon={<Chat />} color="#EC407A" onClick={() => navigate('/chat')} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Quizzes" value={stats?.quizSessionsCount ?? 0}
                  icon={<Quiz />} color="#FF7043" onClick={() => navigate('/quiz')} />
              </Grid>
            </>
          )}
      </Grid>

      {/* Streak */}
      {!loading && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Whatshot sx={{ color: '#FF7043', fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{stats?.streak ?? 0}-day streak</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.streak
                  ? 'Keep it up! Come back tomorrow to continue.'
                  : 'Complete a quiz today to start your streak.'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick actions</Typography>
      <Grid container spacing={2}>
        {[
          { icon: <Add color="primary" />, title: 'Upload material', desc: 'Add a PDF, Word doc, or paste text', path: '/topics' },
          { icon: <Chat color="secondary" />, title: 'Ask a question', desc: 'Chat with your learning companion', path: '/chat' },
          { icon: <Quiz sx={{ color: '#FF7043' }} />, title: 'Take a quiz', desc: 'Test your knowledge', path: '/quiz' },
        ].map((action) => (
          <Grid key={action.path} size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate(action.path)} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {action.icon}
                    <Typography sx={{ fontWeight: 600 }}>{action.title}</Typography>
                  </Box>
                  <ArrowForward fontSize="small" color="action" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {action.desc}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <GoalDialog
        open={goalOpen}
        currentGoal={profile?.goalText ?? ''}
        currentDate={profile?.goalDate ?? ''}
        onClose={() => setGoalOpen(false)}
        onSaved={(p) => { setProfile(p); setGoalOpen(false); }}
      />
    </Box>
  );
}
