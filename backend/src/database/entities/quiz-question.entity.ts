import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { QuizSession } from './quiz-session.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  OPEN_ENDED = 'open_ended',
}

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quizSessionId: string;

  @ManyToOne(() => QuizSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizSessionId' })
  quizSession: QuizSession;

  @Column('text')
  question: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  // For multiple choice: JSON array of options
  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column('text')
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  userAnswer: string;

  @Column({ nullable: true })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ nullable: true })
  sourceChunkId: string;

  @Column({ nullable: true })
  sourceExcerpt: string;
}
