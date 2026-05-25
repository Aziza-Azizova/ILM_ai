import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
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
  id!: string;

  @Column()
  quizSessionId!: string;

  @ManyToOne(() => QuizSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizSessionId' })
  quizSession!: QuizSession;

  @Column('text')
  question!: string;

  @Column({ type: 'enum', enum: QuestionType })
  type!: QuestionType;

  @Column({ type: 'jsonb', nullable: true })
  options!: string[] | null;

  @Column('text')
  correctAnswer!: string;

  @Column({ type: 'text', nullable: true })
  userAnswer!: string | null;

  @Column({ nullable: true })
  isCorrect!: boolean | null;

  @Column('text')
  explanation!: string;

  @Column({ nullable: true })
  sourceChunkId!: string | null;

  @Column({ nullable: true })
  sourceExcerpt!: string | null;
}
