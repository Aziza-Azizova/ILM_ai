import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getProfile(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async updateGoal(userId: string, dto: { goalText?: string; goalDate?: string }) {
    await this.userRepo.update(userId, {
      goalText: dto.goalText,
      goalDate: dto.goalDate ? new Date(dto.goalDate) : undefined,
    });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async updateProfile(userId: string, dto: { name?: string; reminderTime?: string }) {
    await this.userRepo.update(userId, dto);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async getStats(userId: string) {
    const [topicsCount, documentsCount, chatSessionsCount, quizSessionsCount] =
      await Promise.all([
        this.dataSource.query(
          `SELECT COUNT(*) FROM topics WHERE "userId" = $1`, [userId]
        ),
        this.dataSource.query(
          `SELECT COUNT(*) FROM documents WHERE "userId" = $1 AND status = 'ready'`, [userId]
        ),
        this.dataSource.query(
          `SELECT COUNT(*) FROM chat_sessions WHERE "userId" = $1`, [userId]
        ),
        this.dataSource.query(
          `SELECT COUNT(*) FROM quiz_sessions WHERE "userId" = $1`, [userId]
        ),
      ]);

    // Quiz score trend — last 7 sessions
    const recentScores = await this.dataSource.query(
      `SELECT score, "createdAt" FROM quiz_sessions
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC LIMIT 7`,
      [userId],
    );

    const user = await this.userRepo.findOne({ where: { id: userId } });

    return {
      topicsCount: Number(topicsCount[0].count),
      documentsCount: Number(documentsCount[0].count),
      chatSessionsCount: Number(chatSessionsCount[0].count),
      quizSessionsCount: Number(quizSessionsCount[0].count),
      streak: user?.streak ?? 0,
      scoreTrend: recentScores.reverse(), // oldest first for chart
    };
  }
}
