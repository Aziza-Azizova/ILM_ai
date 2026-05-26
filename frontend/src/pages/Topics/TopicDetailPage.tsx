import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, IconButton,
  Chip, Alert, Stack, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  ArrowBack, Upload, Delete, TextFields, InsertDriveFile,
  CheckCircle, HourglassEmpty, Error as ErrorIcon, Refresh,
} from '@mui/icons-material';
import axios from 'axios';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';
import { documentsApi } from '../../api/documents.api';
import type { Document, DocumentStatus } from '../../api/documents.api';
import * as S from './TopicDetailPage.styles';

interface StatusMeta {
  label: string;
  color: 'default' | 'warning' | 'success' | 'error';
  icon: React.ReactNode;
}

const STATUS_META: Record<DocumentStatus, StatusMeta> = {
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
  const [textDialog, setTextDialog] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [savingText, setSavingText] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    if (!id) return;
    try {
      setDocs(await documentsApi.getAll(id));
    } catch { /* silent refresh */ }
  }, [id]);

  const hasPending = docs.some(d => d.status === 'pending' || d.status === 'processing');
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(loadDocs, 3000);
    return () => clearInterval(timer);
  }, [hasPending, loadDocs]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    e.target.value = '';
    setUploading(true);
    setError('');
    try {
      const doc = await documentsApi.uploadFile(file, id);
      setDocs(prev => [doc, ...prev]);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Upload failed')
          : 'Upload failed',
      );
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
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to save text')
          : 'Failed to save text',
      );
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
    <S.PageRoot>
      {/* Header */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/topics')} sx={{ mb: 2 }}>
        My Topics
      </Button>

      <S.PageHeader>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{topic.name}</Typography>
          {topic.description && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{topic.description}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<TextFields />} onClick={() => setTextDialog(true)}>
            Paste text
          </Button>
          <Box>
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload file'}
            </Button>
            <S.UploadCaption variant="caption" color="text.disabled">
              PDF · DOCX · TXT · max 50 MB
            </S.UploadCaption>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
          </Box>
        </Stack>
      </S.PageHeader>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Documents list */}
      {docs.length === 0 ? (
        <S.EmptyStateCard>
          <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No documents yet</Typography>
          <Typography color="text.disabled" sx={{ mb: 3 }}>
            Supported formats: PDF, Word (.docx), plain text (.txt) — max 50 MB
          </Typography>
          <S.EmptyActionsRow direction="row" spacing={2}>
            <Button variant="contained" startIcon={<Upload />} onClick={() => fileInputRef.current?.click()}>
              Upload file
            </Button>
            <Button variant="outlined" startIcon={<TextFields />} onClick={() => setTextDialog(true)}>
              Paste text
            </Button>
          </S.EmptyActionsRow>
        </S.EmptyStateCard>
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
                <S.DocCardContent>
                  <S.DocMainRow>
                    <InsertDriveFile color="action" />
                    <S.DocInfoBox>
                      <Typography sx={{ fontWeight: 600 }} noWrap>{doc.originalName}</Typography>
                      <S.DocChipRow>
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
                      </S.DocChipRow>
                      {doc.status === 'processing' && <S.StyledLinearProgress />}
                    </S.DocInfoBox>
                    <S.DocActionsBox>
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
                    </S.DocActionsBox>
                  </S.DocMainRow>
                </S.DocCardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Paste text dialog */}
      <Dialog open={textDialog} onClose={() => setTextDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Paste text</DialogTitle>
        <S.StyledDialogContent>
          <S.TextTitleField
            fullWidth autoFocus label="Title" placeholder='e.g. "Chapter 3 notes"'
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
          />
          <TextField
            fullWidth multiline rows={10}
            label="Content"
            placeholder="Paste your notes, article, or any text here…"
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
          />
        </S.StyledDialogContent>
        <S.StyledDialogActions>
          <Button onClick={() => setTextDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTextSave}
            disabled={savingText || !textTitle.trim() || !textContent.trim()}
          >
            {savingText ? <CircularProgress size={20} /> : 'Save & process'}
          </Button>
        </S.StyledDialogActions>
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
    </S.PageRoot>
  );
}
