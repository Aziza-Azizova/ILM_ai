import { IsString, IsUUID, MinLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsString()
  @MinLength(1)
  userAnswer!: string;
}
