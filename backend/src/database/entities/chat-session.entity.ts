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

@Entity('chat_sessions')
export class ChatSession {
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

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
