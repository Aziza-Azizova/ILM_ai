import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, IconButton,
  Chip, Alert, Stack, Divider, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack, Upload, Delete, TextFields, InsertDriveFile,
  CheckCircle, HourglassEmpty, Error as ErrorIcon, Refresh,
} from '@mui/icons-material';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';
import { documentsApi } from '../../api/documents.api';
import type { Document, DocumentStatus } from '../../api/documents.api';

const STATUS_META: Record<DocumentStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'default',  icon: <HourglassEmpty fontSize="small" /> },
  processing: { label: 'Processing', color: 'warning',  icon: <CircularProgress size={14} /> },
  ready:      { label: 'Ready',      color: 'success',  icon: <CheckCircle fontSize="small" /> },
  failed:     { label: 'Failed',     color: 'error',    icon: <ErrorIcon fontSize="small" /> },
};

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Text paste dialog
  const [textDialog, setTextDialog] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [savingText, setSavingText] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for processing status every 3 seconds while any doc is pending/processing
  const hasPending = docs.some(d => d.status === 'pending' || d.status === 'processing');
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => loadDocs(), 3000);
    return () => clearInterval(timer);
  }, [hasPending]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      topicsApi.getAll().then(ts => ts.find(t => t.id === id) ?? null),
      documentsApi.getAll(id),
    ])
      .then(([t, d]) => { setTopic(t); setDocs(d); })
      .catch(() => setError('Failed to load topic'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadDocs = async () => {
    if (!id) return;
    try {
      setDocs(await documentsApi.getAll(id));
    } catch { /* silent refresh */ }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    e.target.value = ''; // reset so same file can be re-uploaded
    setUploading(true);
    setError('');
    try {
      const doc = await documentsApi.uploadFile(file, id);
      setDocs(prev => [doc, ...prev]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSave = async () => {
    if (!textTitle.trim() || !textContent.trim() || !id) return;
    setSavingText(true);
    setError('');
    try {
      const doc = await documentsApi.uploadText({ title: textTitle, content: textContent, topicId: id });
      setDocs(prev => [doc, ...prev]);
      setTextDialog(false);
      setTextTitle('');
      setTextContent('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save text');
    } finally {
      setSavingText(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await documentsApi.remove(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch {
      setError('Failed to delete document');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!topic) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Topic not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/topics')}>Back to Topics</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/topics')}
        sx={{ mb: 2 }}
      >
        My Topics
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{topic.name}</Typography>
          {topic.description && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{topic.description}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<TextFields />}
            onClick={() => setTextDialog(true)}
          >
            Paste text
          </Button>
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload file'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
          />
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Documents list */}
      {docs.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No documents yet</Typography>
          <Typography color="text.disabled" sx={{ mb: 3 }}>
            Upload a PDF, Word document, or paste text to get started
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()}>
              Upload file
            </Button>
            <Button variant="outlined" startIcon={<TextFields />} onClick={() => setTextDialog(true)}>
              Paste text
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack spacing={2}>
          {hasPending && (
            <Alert severity="info" icon={<CircularProgress size={16} />}>
              Documents are being processed — this page auto-refreshes every 3 seconds.
            </Alert>
          )}
          {docs.map(doc => {
            const meta = STATUS_META[doc.status];
            return (
              <Card key={doc.id}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <InsertDriveFile color="action" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>{doc.originalName}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          icon={meta.icon as React.ReactElement}
                          label={meta.label}
                          color={meta.color}
                          size="small"
                        />
                        {doc.status === 'ready' && doc.chunkCount && (
                          <Typography variant="caption" color="text.secondary">
                            {doc.chunkCount} chunks
                          </Typography>
                        )}
                        {doc.status === 'failed' && doc.errorMessage && (
                          <Typography variant="caption" color="error">
                            {doc.errorMessage}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {doc.status === 'processing' && (
                        <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {doc.status === 'failed' && (
                        <Tooltip title="Retry processing">
                          <IconButton size="small" onClick={loadDocs}>
                            <Refresh fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteId(doc.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Paste text dialog */}
      <Dialog open={textDialog} onClose={() => setTextDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Paste text</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth autoFocus label="Title" placeholder='e.g. "Chapter 3 notes"'
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth multiline rows={10}
            label="Content"
            placeholder="Paste your notes, article, or any text here…"
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTextDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTextSave}
            disabled={savingText || !textTitle.trim() || !textContent.trim()}
          >
            {savingText ? <CircularProgress size={20} /> : 'Save & process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete document?</DialogTitle>
        <DialogContent>
          <Typography>This will remove the document and all its chunks. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
