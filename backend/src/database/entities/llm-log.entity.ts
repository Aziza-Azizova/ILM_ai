import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('llm_logs')
export class LlmLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column()
  provider!: string;

  @Column()
  model!: string;

  @Column()
  feature!: string;

  @Column({ type: 'int', default: 0 })
  promptTokens!: number;

  @Column({ type: 'int', default: 0 })
  completionTokens!: number;

  @Column({ type: 'int', default: 0 })
  latencyMs!: number;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
