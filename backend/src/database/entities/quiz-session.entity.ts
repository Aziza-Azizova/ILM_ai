import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Topic } from './topic.entity';

export enum QuizDifficulty {
  GENTLE = 'gentle',
  SOLID = 'solid',
  EXPERT = 'expert',
}

@Entity('quiz_sessions')
export class QuizSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid', nullable: true })
  topicId!: string | null;

  @ManyToOne(() => Topic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topicId' })
  topic!: Topic | null;

  @Column({
    type: 'enum',
    enum: QuizDifficulty,
    default: QuizDifficulty.GENTLE,
  })
  difficulty!: QuizDifficulty;

  @Column({ type: 'float', default: 0 })
  score!: number; // 0–100

  @Column({ default: 0 })
  totalQuestions!: number;

  @Column({ default: 0 })
  correctAnswers!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
