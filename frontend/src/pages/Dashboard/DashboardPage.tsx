import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, Typography, Skeleton, Alert,
} from '@mui/material';
import {
  FolderOpen, Chat, Quiz, TrendingUp, ArrowForward,
} from '@mui/icons-material';
import { usersApi } from '../../api/users.api';
import type { UserStats, UserProfile } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import GoalDialog from './GoalDialog';
import * as S from './DashboardPage.styles';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  return (
    <S.StatCardRoot>
      <S.StatCardAction onClick={onClick} disabled={!onClick}>
        <S.StatContentBox>
          <S.StatIconBox accentColor={color}>{icon}</S.StatIconBox>
          <div>
            <S.StatValue variant="h5">{value}</S.StatValue>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </div>
        </S.StatContentBox>
      </S.StatCardAction>
    </S.StatCardRoot>
  );
}

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  desc: string;
  path: string;
}

const quickActions: QuickAction[] = [
  { icon: <Chat color="primary" />, title: 'Upload material', desc: 'Add a PDF, Word doc, or paste text', path: '/topics' },
  { icon: <Chat color="secondary" />, title: 'Ask a question', desc: 'Chat with your learning companion', path: '/chat' },
  { icon: <Quiz sx={{ color: '#FF7043' }} />, title: 'Take a quiz', desc: 'Test your knowledge', path: '/quiz' },
];

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

  const [today] = useState(() => Date.now());
  const daysUntilGoal = profile?.goalDate
    ? Math.max(0, Math.ceil((new Date(profile.goalDate).getTime() - today) / 86400000))
    : null;

  return (
    <S.PageRoot>
      {/* Header */}
      <S.PageHeader>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Here's what's happening with your learning
        </Typography>
      </S.PageHeader>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Goal banner */}
      <S.GoalCard>
        <S.GoalContent>
          <S.GoalIcon />
          <S.GoalTextBox>
            {profile?.goalText ? (
              <>
                <Typography sx={{ fontWeight: 600 }}>{profile.goalText}</Typography>
                {daysUntilGoal !== null && (
                  <S.GoalCountdown variant="body2">
                    {daysUntilGoal === 0 ? '🎯 Goal day is today!' : `${daysUntilGoal} days to go`}
                  </S.GoalCountdown>
                )}
              </>
            ) : (
              <Typography sx={{ fontWeight: 600 }}>No goal set yet — what are you working towards?</Typography>
            )}
          </S.GoalTextBox>
          <S.GoalButton variant="outlined" size="small" onClick={() => setGoalOpen(true)}>
            {profile?.goalText ? 'Edit goal' : 'Set goal'}
          </S.GoalButton>
        </S.GoalContent>
      </S.GoalCard>

      {/* Stats grid */}
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
        <S.StreakCard>
          <S.StreakContent>
            <S.StreakIcon />
            <div>
              <Typography sx={{ fontWeight: 700 }}>{stats?.streak ?? 0}-day streak</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.streak
                  ? 'Keep it up! Come back tomorrow to continue.'
                  : 'Complete a quiz today to start your streak.'}
              </Typography>
            </div>
          </S.StreakContent>
        </S.StreakCard>
      )}

      {/* Quick actions */}
      <S.QuickActionsTitle variant="h6">Quick actions</S.QuickActionsTitle>
      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid key={action.path} size={{ xs: 12, sm: 4 }}>
            <Card>
              <S.QuickActionArea onClick={() => navigate(action.path)}>
                <S.QuickActionHeader>
                  <S.QuickActionTitleBox>
                    {action.icon}
                    <S.QuickActionTitle>{action.title}</S.QuickActionTitle>
                  </S.QuickActionTitleBox>
                  <ArrowForward fontSize="small" color="action" />
                </S.QuickActionHeader>
                <S.QuickActionDesc variant="body2" color="text.secondary">
                  {action.desc}
                </S.QuickActionDesc>
              </S.QuickActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <GoalDialog
        key={String(goalOpen)}
        open={goalOpen}
        currentGoal={profile?.goalText ?? ''}
        currentDate={profile?.goalDate ?? ''}
        onClose={() => setGoalOpen(false)}
        onSaved={(p) => { setProfile(p); setGoalOpen(false); }}
      />
    </S.PageRoot>
  );
}
