import { apiClient } from './client';

export interface ChatSession {
  id: string;
  topicId: string | null;
  title: string | null;
  createdAt: string;
}

export interface SourceChunk {
  chunkId: string;
  documentName: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sourceChunks: SourceChunk[] | null;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const chatApi = {
  createSession: (topicId?: string): Promise<ChatSession> =>
    apiClient.post<ChatSession>('/chat/sessions', { topicId }).then(r => r.data),

  getSessions: (): Promise<ChatSession[]> =>
    apiClient.get<ChatSession[]>('/chat/sessions').then(r => r.data),

  getMessages: (sessionId: string): Promise<ChatMessage[]> =>
    apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`).then(r => r.data),

  /**
   * Send a message and stream the response.
   * Calls onChunk for each text delta, onDone when finished, onError on failure.
   * Uses fetch() directly because EventSource only supports GET (no auth headers).
   */
  streamMessage: async (
    sessionId: string,
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<void> => {
    const token = localStorage.getItem('ilmai_token');
    let response: Response;

    try {
      response = await fetch(`${API_URL}/chat/sessions/${sessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });
    } catch {
      onError('Network error — is the backend running?');
      return;
    }

    if (!response.ok) {
      onError(`Server error ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError('No response stream'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by \n\n
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? ''; // keep incomplete last part

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) onChunk(data.text);
            if (data.done) onDone();
            if (data.error) onError(data.error);
          } catch { /* malformed line — skip */ }
        }
      }
    }
  },
};
