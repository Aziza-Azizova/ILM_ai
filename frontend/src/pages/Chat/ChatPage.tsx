import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, IconButton, TextField, Paper, Avatar,
  List, ListItemButton, ListItemText, Divider, Chip, Tooltip,
  CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Stack,
} from '@mui/material';
import {
  Send, Add, Chat as ChatIcon, School, Person,
  ExpandMore, ExpandLess, Menu as MenuIcon,
} from '@mui/icons-material';
import { chatApi } from '../../api/chat.api';
import type { ChatSession, ChatMessage, SourceChunk } from '../../api/chat.api';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';

const SIDEBAR_WIDTH = 260;

// ── Source citations ──────────────────────────────────────────────────────────
function SourceCitations({ sources }: { sources: SourceChunk[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;
  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        startIcon={open ? <ExpandLess /> : <ExpandMore />}
        onClick={() => setOpen(o => !o)}
        sx={{ fontSize: 12, color: 'text.secondary', p: 0, minWidth: 0 }}
      >
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </Button>
      {open && (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sources.map((s, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {s.documentName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                "{s.excerpt}"
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, streaming }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 1.5, mb: 2, alignItems: 'flex-start',
    }}>
      <Avatar sx={{
        width: 32, height: 32, flexShrink: 0,
        bgcolor: isUser ? 'primary.main' : 'secondary.main',
      }}>
        {isUser ? <Person fontSize="small" /> : <School fontSize="small" />}
      </Avatar>
      <Box sx={{ maxWidth: '75%' }}>
        <Paper sx={{
          px: 2, py: 1.5, borderRadius: 3,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'white' : 'text.primary',
          boxShadow: 1,
        }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
            {msg.content}
            {streaming && (
              <Box component="span" sx={{
                display: 'inline-block', width: 8, height: 14,
                bgcolor: 'secondary.main', ml: 0.5, borderRadius: 0.5,
                animation: 'blink 1s step-end infinite',
                '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
              }} />
            )}
          </Typography>
        </Paper>
        {!isUser && msg.sourceChunks?.length ? (
          <SourceCitations sources={msg.sourceChunks} />
        ) : null}
      </Box>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // New session dialog
  const [newDialog, setNewDialog] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatApi.getSessions().then(setSessions).catch(() => {});
    topicsApi.getAll().then(setTopics).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session);
    setMessages([]);
    setError('');
    setLoading(true);
    try {
      setMessages(await chatApi.getMessages(session.id));
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleNewSession = async () => {
    setCreating(true);
    try {
      const session = await chatApi.createSession(selectedTopic || undefined);
      setSessions(prev => [session, ...prev]);
      setNewDialog(false);
      setSelectedTopic('');
      await selectSession(session);
    } catch {
      setError('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSession || streaming) return;
    const text = input.trim();
    setInput('');
    setError('');

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatSessionId: activeSession.id,
      role: 'user',
      content: text,
      sourceChunks: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setStreaming(true);
    setStreamingText('');

    let fullText = '';

    await chatApi.streamMessage(
      activeSession.id,
      text,
      (chunk) => {
        fullText += chunk;
        setStreamingText(fullText);
      },
      () => {
        // Stream done — replace streaming bubble with real message
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          chatSessionId: activeSession.id,
          role: 'assistant',
          content: fullText,
          sourceChunks: null, // will be loaded on next getMessages call
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setStreamingText('');
        setStreaming(false);

        // Refresh messages to get proper IDs + source chunks from DB
        chatApi.getMessages(activeSession.id)
          .then(setMessages)
          .catch(() => {});

        // Update session title in sidebar if it was just set
        chatApi.getSessions().then(setSessions).catch(() => {});
      },
      (err) => {
        setError(err);
        setStreamingText('');
        setStreaming(false);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const sidebar = (
    <Box sx={{
      width: SIDEBAR_WIDTH, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid', borderColor: 'divider',
      bgcolor: 'background.paper', height: '100%',
    }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Conversations</Typography>
        <Tooltip title="New chat">
          <IconButton size="small" color="primary" onClick={() => setNewDialog(true)}>
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      {sessions.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No chats yet</Typography>
          <Button size="small" startIcon={<Add />} onClick={() => setNewDialog(true)} sx={{ mt: 1 }}>
            Start a chat
          </Button>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
          {sessions.map(s => (
            <ListItemButton
              key={s.id}
              selected={activeSession?.id === s.id}
              onClick={() => selectSession(s)}
              sx={{
                borderRadius: 0,
                '&.Mui-selected': { bgcolor: 'primary.50', borderLeft: '3px solid', borderColor: 'primary.main' },
              }}
            >
              <ListItemText
                primary={s.title ?? 'New conversation'}
                secondary={new Date(s.createdAt).toLocaleDateString()}
                primaryTypographyProps={{ noWrap: true, variant: 'body2', fontWeight: activeSession?.id === s.id ? 600 : 400 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );

  // ── Main area ─────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar — hidden on mobile when toggled off */}
      <Box sx={{ display: { xs: sidebarOpen ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column' }}>
        {sidebar}
      </Box>

      {/* Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <Box sx={{
          px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <IconButton size="small" onClick={() => setSidebarOpen(o => !o)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <School color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {activeSession?.title ?? 'AI Learning Companion'}
            </Typography>
            {activeSession?.topicId && (
              <Typography variant="caption" color="text.secondary">
                Topic session
              </Typography>
            )}
          </Box>
          {!activeSession && (
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setNewDialog(true)}>
              New chat
            </Button>
          )}
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          {!activeSession ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
              <ChatIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">Select a conversation or start a new one</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setNewDialog(true)}>
                New chat
              </Button>
            </Box>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {messages.length === 0 && !streaming && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <School sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    Ask me anything about your uploaded materials
                  </Typography>
                  {topics.length > 0 && (
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      {['Summarise this topic', 'What are the key concepts?', 'Quiz me on this'].map(s => (
                        <Chip
                          key={s} label={s} variant="outlined" size="small"
                          onClick={() => { setInput(s); inputRef.current?.focus(); }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {streaming && streamingText && (
                <MessageBubble
                  msg={{ id: 'streaming', chatSessionId: activeSession.id, role: 'assistant', content: streamingText, sourceChunks: null, createdAt: '' }}
                  streaming
                />
              )}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <div ref={bottomRef} />
            </>
          )}
        </Box>

        {/* Input */}
        {activeSession && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                inputRef={inputRef}
                fullWidth multiline maxRows={5}
                placeholder="Ask a question about your materials… (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={streaming}
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
              >
                {streaming ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* New session dialog */}
      <Dialog open={newDialog} onClose={() => setNewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New conversation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Optionally restrict the chat to materials from one topic.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Topic (optional)</InputLabel>
            <Select
              value={selectedTopic}
              label="Topic (optional)"
              onChange={e => setSelectedTopic(e.target.value as string)}
            >
              <MenuItem value=""><em>All my materials</em></MenuItem>
              {topics.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleNewSession} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Start chat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
