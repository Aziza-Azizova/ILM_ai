import {
  Controller, Post, Get, Param, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { QuizService } from './quiz.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private quizService: QuizService) {}

  /** POST /api/quiz/start — generate a new quiz session */
  @Post('start')
  start(@CurrentUser() user: User, @Body() dto: StartQuizDto) {
    return this.quizService.startQuiz(user.id, dto);
  }

  /** POST /api/quiz/:sessionId/answer — submit one answer */
  @Post(':sessionId/answer')
  submitAnswer(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.quizService.submitAnswer(user.id, sessionId, dto);
  }

  /** POST /api/quiz/:sessionId/finish — close session and compute score */
  @Post(':sessionId/finish')
  finish(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.quizService.finishSession(user.id, sessionId);
  }

  /** GET /api/quiz/history — past sessions */
  @Get('history')
  history(@CurrentUser() user: User) {
    return this.quizService.getHistory(user.id);
  }

  /** GET /api/quiz/:sessionId — full session + questions */
  @Get(':sessionId')
  getSession(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.quizService.getSession(user.id, sessionId);
  }
}
