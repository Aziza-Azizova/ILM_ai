import { useEffect, useState } from 'react';
import {
  Typography, Button, Card, CardContent, CardActionArea,
  CardActions, IconButton, Dialog, DialogTitle,
  TextField, Skeleton, Alert, Tooltip, Grid,
} from '@mui/material';
import { Add, Delete, FolderOpen, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';
import * as S from './TopicsPage.styles';

interface TopicForm {
  name: string;
  description: string;
}

export default function TopicsPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [form, setForm] = useState<TopicForm>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    topicsApi.getAll()
      .then(setTopics)
      .catch(() => setError('Failed to load topics'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditTopic(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditTopic(topic);
    setForm({ name: topic.name, description: topic.description ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTopic) {
        const updated = await topicsApi.update(editTopic.id, form);
        setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await topicsApi.create(form);
        setTopics((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch {
      setError('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await topicsApi.remove(id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete topic');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <S.PageRoot>
      <S.PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>My Topics</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Organise your learning materials into topics
          </Typography>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          New topic
        </Button>
      </S.PageHeader>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Empty state */}
      {!loading && topics.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <FolderOpen sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No topics yet</Typography>
          <Typography color="text.disabled" sx={{ mb: 3 }}>
            Create a topic to start organising your materials.<br />
            Examples: "Cloud Architecture", "Ottoman History", "Italian Cooking Theory"
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create your first topic
          </Button>
        </Card>
      )}

      {/* Topics grid */}
      <Grid container spacing={2}>
        {loading
          ? [1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={140} />
              </Grid>
            ))
          : topics.map((topic) => (
              <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea sx={{ flex: 1 }} onClick={() => navigate(`/topics/${topic.id}`)}>
                    <CardContent>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <FolderOpen color="primary" />
                        <Typography sx={{ fontWeight: 600, lineHeight: 1.2 }} variant="h6">
                          {topic.name}
                        </Typography>
                      </div>
                      {topic.description && (
                        <S.DescriptionText variant="body2" color="text.secondary">
                          {topic.description}
                        </S.DescriptionText>
                      )}
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                        Created {new Date(topic.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(topic)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteId(topic.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
      </Grid>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTopic ? 'Edit topic' : 'New topic'}</DialogTitle>
        <S.StyledDialogContent>
          <TextField
            fullWidth autoFocus label="Topic name" sx={{ mb: 2 }}
            placeholder='e.g. Cloud Architecture, Tax Law, Italian Cooking Theory'
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <TextField
            fullWidth label="Description (optional)"
            placeholder="What are you learning in this topic?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline rows={2}
          />
        </S.StyledDialogContent>
        <S.StyledDialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : editTopic ? 'Save changes' : 'Create topic'}
          </Button>
        </S.StyledDialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete topic?</DialogTitle>
        <S.StyledDialogContent>
          <Typography>
            This will also delete all uploaded materials in this topic. This cannot be undone.
          </Typography>
        </S.StyledDialogContent>
        <S.StyledDialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
            Delete
          </Button>
        </S.StyledDialogActions>
      </Dialog>
    </S.PageRoot>
  );
}
