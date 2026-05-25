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

  @Column({ nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ nullable: true })
  googleId!: string | null;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan!: UserPlan;

  @Column({ nullable: true })
  telegramChatId!: string | null;

  @Column({ nullable: true })
  goalText!: string | null;

  @Column({ nullable: true, type: 'date' })
  goalDate!: Date | null;

  @Column({ nullable: true })
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
