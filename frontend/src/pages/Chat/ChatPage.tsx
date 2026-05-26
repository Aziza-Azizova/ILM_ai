import { useEffect, useRef, useState } from 'react';
import {
  Typography, IconButton, TextField, Paper,
  Divider, Chip, Tooltip,
  CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem,
} from '@mui/material';
import {
  Send, Add, Chat as ChatIcon, School, Person,
  ExpandMore, ExpandLess, Menu as MenuIcon,
} from '@mui/icons-material';
import { chatApi } from '../../api/chat.api';
import type { ChatSession, ChatMessage, SourceChunk } from '../../api/chat.api';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';
import * as S from './ChatPage.styles';

interface SourceCitationsProps {
  sources: SourceChunk[];
}

interface MessageBubbleProps {
  msg: ChatMessage;
  streaming?: boolean;
}

// ── Source citations ──────────────────────────────────────────────────────────
function SourceCitations({ sources }: SourceCitationsProps) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <S.SourcesToggleButton
        size="small"
        startIcon={open ? <ExpandLess /> : <ExpandMore />}
        onClick={() => setOpen(o => !o)}
      >
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </S.SourcesToggleButton>
      {open && (
        <S.SourcesList>
          {sources.map((s, i) => (
            <S.SourcePaper key={i} variant="outlined">
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {s.documentName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                "{s.excerpt}"
              </Typography>
            </S.SourcePaper>
          ))}
        </S.SourcesList>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, streaming }: MessageBubbleProps) {
  const isUser = msg.role === 'user';
  return (
    <S.MessageWrapper isUser={isUser}>
      <S.MessageAvatar isUser={isUser}>
        {isUser ? <Person fontSize="small" /> : <School fontSize="small" />}
      </S.MessageAvatar>
      <S.MessageContentBox>
        <S.MessagePaper isUser={isUser}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
            {msg.content}
            {streaming && <S.BlinkCursor />}
          </Typography>
        </S.MessagePaper>
        {!isUser && msg.sourceChunks?.length ? (
          <SourceCitations sources={msg.sourceChunks} />
        ) : null}
      </S.MessageContentBox>
    </S.MessageWrapper>
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
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          chatSessionId: activeSession.id,
          role: 'assistant',
          content: fullText,
          sourceChunks: null,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        setStreamingText('');
        setStreaming(false);
        chatApi.getMessages(activeSession.id).then(setMessages).catch(() => {});
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
    <S.SidebarPanel>
      <S.SidebarHeader>
        <S.ConversationsTitle variant="subtitle1">Conversations</S.ConversationsTitle>
        <Tooltip title="New chat">
          <IconButton size="small" color="primary" onClick={() => setNewDialog(true)}>
            <Add />
          </IconButton>
        </Tooltip>
      </S.SidebarHeader>
      <Divider />
      {sessions.length === 0 ? (
        <S.SidebarEmptyBox>
          <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No chats yet</Typography>
          <Button size="small" startIcon={<Add />} onClick={() => setNewDialog(true)} sx={{ mt: 1 }}>
            Start a chat
          </Button>
        </S.SidebarEmptyBox>
      ) : (
        <S.SessionList>
          {sessions.map(s => (
            <S.SessionButton
              key={s.id}
              selected={activeSession?.id === s.id}
              onClick={() => selectSession(s)}
            >
              <Paper
                component="div"
                elevation={0}
                sx={{ background: 'transparent', width: '100%' }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ fontWeight: activeSession?.id === s.id ? 600 : 400 }}
                >
                  {s.title ?? 'New conversation'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(s.createdAt).toLocaleDateString()}
                </Typography>
              </Paper>
            </S.SessionButton>
          ))}
        </S.SessionList>
      )}
    </S.SidebarPanel>
  );

  // ── Main area ─────────────────────────────────────────────────────────────

  return (
    <S.ChatRoot>
      <S.SidebarContainer isOpen={sidebarOpen}>
        {sidebar}
      </S.SidebarContainer>

      <S.ChatArea>
        {/* Top bar */}
        <S.TopBar>
          <S.MenuToggle size="small" onClick={() => setSidebarOpen(o => !o)}>
            <MenuIcon />
          </S.MenuToggle>
          <School color="primary" />
          <S.TopBarTitleBox>
            <S.TopBarTitle variant="subtitle1">
              {activeSession?.title ?? 'AI Learning Companion'}
            </S.TopBarTitle>
            {activeSession?.topicId && (
              <Typography variant="caption" color="text.secondary">
                Topic session
              </Typography>
            )}
          </S.TopBarTitleBox>
          {!activeSession && (
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setNewDialog(true)}>
              New chat
            </Button>
          )}
        </S.TopBar>

        {/* Messages */}
        <S.MessagesArea>
          {!activeSession ? (
            <S.EmptyStateBox>
              <ChatIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">Select a conversation or start a new one</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setNewDialog(true)}>
                New chat
              </Button>
            </S.EmptyStateBox>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
              <CircularProgress />
            </div>
          ) : (
            <>
              {messages.length === 0 && !streaming && (
                <div style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
                  <School sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    Ask me anything about your uploaded materials
                  </Typography>
                  {topics.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                      {['Summarise this topic', 'What are the key concepts?', 'Quiz me on this'].map(s => (
                        <Chip
                          key={s} label={s} variant="outlined" size="small"
                          onClick={() => { setInput(s); inputRef.current?.focus(); }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
        </S.MessagesArea>

        {/* Input */}
        {activeSession && (
          <S.InputArea>
            <S.InputRow>
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
              <S.SendButton
                onClick={handleSend}
                disabled={!input.trim() || streaming}
              >
                {streaming ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
              </S.SendButton>
            </S.InputRow>
          </S.InputArea>
        )}
      </S.ChatArea>

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
    </S.ChatRoot>
  );
}
