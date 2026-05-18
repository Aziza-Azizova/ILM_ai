import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../../database/entities/chat-session.entity';
import { ChatMessage, MessageRole } from '../../database/entities/chat-message.entity';
import { AiService } from '../ai/ai.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession) private sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage) private messageRepo: Repository<ChatMessage>,
    private aiService: AiService,
    private documentsService: DocumentsService,
  ) {}

  async createSession(userId: string, topicId?: string): Promise<ChatSession> {
    const session = this.sessionRepo.create({ userId, topicId });
    return this.sessionRepo.save(session);
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getMessages(sessionId: string, userId: string): Promise<ChatMessage[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return this.messageRepo.find({
      where: { chatSessionId: sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async *streamMessage(params: {
    sessionId: string;
    userId: string;
    userMessage: string;
  }): AsyncGenerator<string> {
    const session = await this.sessionRepo.findOne({
      where: { id: params.sessionId, userId: params.userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    // Save user message
    await this.messageRepo.save(
      this.messageRepo.create({
        chatSessionId: params.sessionId,
        role: MessageRole.USER,
        content: params.userMessage,
      }),
    );

    // Retrieve relevant context from user's knowledge base
    const chunks = await this.documentsService.semanticSearch({
      userId: params.userId,
      query: params.userMessage,
      topicId: session.topicId ?? undefined,
      limit: 5,
    });

    const context = chunks
      .map(c => `[${c.documentName}]\n${c.content}`)
      .join('\n\n---\n\n');

    // Get recent history (last 10 messages)
    const history = await this.messageRepo.find({
      where: { chatSessionId: params.sessionId },
      order: { createdAt: 'ASC' },
      take: 10,
    });

    const historyForAi = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Stream response
    let fullResponse = '';
    for await (const chunk of this.aiService.streamChat({
      userId: params.userId,
      context,
      history: historyForAi,
      userMessage: params.userMessage,
    })) {
      fullResponse += chunk;
      yield chunk;
    }

    // Save assistant message with source citations
    await this.messageRepo.save(
      this.messageRepo.create({
        chatSessionId: params.sessionId,
        role: MessageRole.ASSISTANT,
        content: fullResponse,
        sourceChunks: chunks.map(c => ({
          chunkId: c.chunkId,
          documentName: c.documentName,
          excerpt: c.content.slice(0, 200),
        })),
      }),
    );

    // Update session title from first user message
    if (!session.title) {
      const title = params.userMessage.slice(0, 60);
      await this.sessionRepo.update(params.sessionId, { title });
    }
  }
}
