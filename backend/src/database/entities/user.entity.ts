import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserPlan {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ type: 'varchar', nullable: true })
  googleId!: string | null;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan!: UserPlan;

  @Column({ type: 'varchar', nullable: true })
  telegramChatId!: string | null;

  @Column({ type: 'text', nullable: true })
  goalText!: string | null;

  @Column({ nullable: true, type: 'date' })
  goalDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  reminderTime!: string | null;

  @Column({ default: 0 })
  streak!: number;

  @Column({ nullable: true, type: 'date' })
  lastActiveDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
