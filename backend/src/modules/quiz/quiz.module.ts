import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSession } from '../../database/entities/quiz-session.entity';
import { QuizQuestion } from '../../database/entities/quiz-question.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AiModule } from '../ai/ai.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizSession, QuizQuestion]),
    AiModule,
    DocumentsModule,
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
