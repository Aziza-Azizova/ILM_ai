import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [
          User, Topic, Document, DocumentChunk,
          ChatSession, ChatMessage,
          QuizSession, QuizQuestion,
          Subscription, LlmLog,
        ],
        migrations: [__dirname + '/migrations/*.ts'],
        synchronize: false, // Always false — use migrations
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
