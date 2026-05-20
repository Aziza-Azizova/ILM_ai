import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { QuizDifficulty } from '../../../database/entities/quiz-session.entity';

export class StartQuizDto {
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsEnum(QuizDifficulty)
  difficulty: QuizDifficulty;

  @IsInt()
  @Min(3)
  @Max(20)
  questionCount: number;
}
