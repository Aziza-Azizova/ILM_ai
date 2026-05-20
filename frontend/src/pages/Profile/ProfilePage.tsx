import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Avatar, Divider, Alert, Chip, CircularProgress,
} from '@mui/material';
import { EmojiEvents, Logout } from '@mui/icons-material';
import { usersApi } from '../../api/users.api';
import type { UserProfile } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';

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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto', width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Profile</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile saved!</Alert>}

      {/* Avatar + plan */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 28 }}>
            {(name || user?.email || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{name || 'Learner'}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Chip
              size="small"
              label={profile?.plan === 'premium' ? '⭐ Premium' : 'Free plan'}
              color={profile?.plan === 'premium' ? 'primary' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Edit name */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Your name
          </Typography>
          <TextField
            fullWidth label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained" onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? <CircularProgress size={20} /> : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Goal summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <EmojiEvents color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Learning goal</Typography>
          </Box>
          {profile?.goalText ? (
            <>
              <Typography>{profile.goalText}</Typography>
              {profile.goalDate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Target: {new Date(profile.goalDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Typography>
              )}
            </>
          ) : (
            <Typography color="text.secondary">
              No goal set. Go to the dashboard to add one.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Danger zone */}
      <Button
        variant="outlined" color="error" startIcon={<Logout />}
        onClick={handleLogout} fullWidth
      >
        Log out
      </Button>
    </Box>
  );
}
