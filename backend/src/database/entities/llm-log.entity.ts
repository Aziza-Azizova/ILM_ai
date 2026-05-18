import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('llm_logs')
export class LlmLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column() // 'anthropic' | 'openai'
  provider: string;

  @Column()
  model: string;

  @Column()
  feature: string; // 'chat' | 'quiz' | 'plan' | 'gaps' | 'embedding'

  @Column({ type: 'int', default: 0 })
  promptTokens: number;

  @Column({ type: 'int', default: 0 })
  completionTokens: number;

  @Column({ type: 'int', default: 0 })
  latencyMs: number;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}
