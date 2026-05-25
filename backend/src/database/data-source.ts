import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Topic } from './entities/topic.entity';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { QuizSession } from './entities/quiz-session.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { Subscription } from './entities/subscription.entity';
import { LlmLog } from './entities/llm-log.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'ilmai',
  password: process.env.DB_PASSWORD ?? 'ilmai_password',
  database: process.env.DB_NAME ?? 'ilmai',
  entities: [
    User,
    Topic,
    Document,
    DocumentChunk,
    ChatSession,
    ChatMessage,
    QuizSession,
    QuizQuestion,
    Subscription,
    LlmLog,
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
});
