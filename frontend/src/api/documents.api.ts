import { apiClient } from './client';

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface UploadTextParams {
  title: string;
  content: string;
  topicId?: string;
}

export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  status: DocumentStatus;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  topicId: string | null;
}

export const documentsApi = {
  /** Upload a file (PDF / DOCX / TXT) */
  uploadFile: (file: File, topicId?: string): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    if (topicId) form.append('topicId', topicId);
    return apiClient
      .post<Document>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },

  /** Upload pasted text */
  uploadText: (params: UploadTextParams): Promise<Document> =>
    apiClient.post<Document>('/documents/text', params).then(r => r.data),

  /** List documents, optionally filtered by topic */
  getAll: (topicId?: string): Promise<Document[]> =>
    apiClient.get<Document[]>('/documents', { params: topicId ? { topicId } : {} }).then(r => r.data),

  /** Delete a document */
  remove: (id: string): Promise<void> =>
    apiClient.delete(`/documents/${id}`).then(() => undefined),
};
