import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';

export enum UserPlan {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ nullable: true })
  telegramChatId: string;

  @Column({ nullable: true })
  goalText: string;

  @Column({ nullable: true, type: 'date' })
  goalDate: Date;

  @Column({ nullable: true })
  reminderTime: string; // HH:MM format

  @Column({ default: 0 })
  streak: number;

  @Column({ nullable: true, type: 'date' })
  lastActiveDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
