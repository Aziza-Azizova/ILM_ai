import { useEffect, useState } from 'react';
import { Typography, Button, Alert, CircularProgress } from '@mui/material';
import { EmojiEvents, Logout } from '@mui/icons-material';
import { usersApi } from '../../api/users.api';
import type { UserProfile } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import * as S from './ProfilePage.styles';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.getProfile().then((p) => {
      setProfile(p);
      setName(p.name ?? '');
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await usersApi.updateProfile({ name });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <S.PageRoot>
      <S.PageTitle variant="h4">Profile</S.PageTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile saved!</Alert>}

      {/* Avatar + plan */}
      <S.ProfileCard>
        <S.AvatarCardContent>
          <S.UserAvatar>
            {(name || user?.email || '?')[0].toUpperCase()}
          </S.UserAvatar>
          <div>
            <S.DisplayName variant="h6">{name || 'Learner'}</S.DisplayName>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <S.PlanChip
              size="small"
              label={profile?.plan === 'premium' ? '⭐ Premium' : 'Free plan'}
              color={profile?.plan === 'premium' ? 'primary' : 'default'}
            />
          </div>
        </S.AvatarCardContent>
      </S.ProfileCard>

      {/* Edit name */}
      <S.ProfileCard>
        <S.AvatarCardContent sx={{ display: 'block' }}>
          <S.SectionTitle variant="subtitle1">Your name</S.SectionTitle>
          <S.NameTextField
            fullWidth label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <CircularProgress size={20} /> : 'Save changes'}
          </Button>
        </S.AvatarCardContent>
      </S.ProfileCard>

      {/* Goal summary */}
      <S.ProfileCard>
        <S.AvatarCardContent sx={{ display: 'block' }}>
          <S.GoalSectionHeader>
            <EmojiEvents color="primary" />
            <S.SectionTitle variant="subtitle1" sx={{ mb: 0 }}>Learning goal</S.SectionTitle>
          </S.GoalSectionHeader>
          {profile?.goalText ? (
            <>
              <Typography>{profile.goalText}</Typography>
              {profile.goalDate && (
                <S.TargetDate variant="body2" color="text.secondary">
                  Target: {new Date(profile.goalDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </S.TargetDate>
              )}
            </>
          ) : (
            <Typography color="text.secondary">
              No goal set. Go to the dashboard to add one.
            </Typography>
          )}
        </S.AvatarCardContent>
      </S.ProfileCard>

      <S.SectionDivider />

      <Button
        variant="outlined" color="error" startIcon={<Logout />}
        onClick={handleLogout} fullWidth
      >
        Log out
      </Button>
    </S.PageRoot>
  );
}
