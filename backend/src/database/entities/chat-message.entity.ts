import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  chatSessionId!: string;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatSessionId' })
  chatSession!: ChatSession;

  @Column({ type: 'enum', enum: MessageRole })
  role!: MessageRole;

  @Column('text')
  content!: string;

  // JSON array of { chunkId, documentName, excerpt }
  @Column({ type: 'jsonb', nullable: true })
  sourceChunks!: Array<{
    chunkId: string;
    documentName: string;
    excerpt: string;
  }> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
