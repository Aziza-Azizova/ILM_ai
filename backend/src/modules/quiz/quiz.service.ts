import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QuizSession } from '../../database/entities/quiz-session.entity';
import { QuizQuestion, QuestionType } from '../../database/entities/quiz-question.entity';
import { AiService } from '../ai/ai.service';
import { DocumentsService } from '../documents/documents.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

/** Shape returned by AI for each generated question */
interface GeneratedQuestion {
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'open_ended';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceExcerpt: string;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(QuizSession) private sessionRepo: Repository<QuizSession>,
    @InjectRepository(QuizQuestion) private questionRepo: Repository<QuizQuestion>,
    private aiService: AiService,
    private documentsService: DocumentsService,
    private dataSource: DataSource,
  ) {}

  // ─── Start a new quiz session ────────────────────────────────────────────────

  async startQuiz(userId: string, dto: StartQuizDto): Promise<QuizSession & { questions: QuizQuestion[] }> {
    // Retrieve relevant context from uploaded materials
    const searchResult = await this.documentsService.semanticSearch({
      userId,
      query: 'key concepts definitions principles important topics',
      topicId: dto.topicId,
      limit: 12,
    });

    if (searchResult.length === 0) {
      throw new BadRequestException(
        'No processed documents found. Please upload and wait for documents to finish processing.',
      );
    }

    const context = searchResult
      .map(r => `[${r.documentName}]\n${r.content}`)
      .join('\n\n---\n\n');

    // Generate questions via AI
    const raw: GeneratedQuestion[] = await this.aiService.generateQuiz({
      userId,
      context,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount,
    });

    // Persist session + questions in a transaction
    return this.dataSource.transaction(async manager => {
      const session = manager.create(QuizSession, {
        userId,
        topicId: dto.topicId,
        difficulty: dto.difficulty,
        totalQuestions: raw.length,
        score: 0,
        correctAnswers: 0,
      });
      await manager.save(session);

      const questions: QuizQuestion[] = [];
      for (const q of raw) {
        const question = manager.create(QuizQuestion, {
          quizSessionId: session.id,
          question: q.question,
          type: q.type as QuestionType,
          options: q.options ?? null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          sourceExcerpt: q.sourceExcerpt,
        });
        await manager.save(question);
        questions.push(question);
      }

      return { ...session, questions };
    });
  }

  // ─── Submit an answer ────────────────────────────────────────────────────────

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitAnswerDto,
  ): Promise<{ isCorrect: boolean; feedback: string; correctAnswer: string; explanation: string }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Quiz session not found');

    const question = await this.questionRepo.findOne({
      where: { id: dto.questionId, quizSessionId: sessionId },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.userAnswer !== null && question.userAnswer !== undefined) {
      throw new ForbiddenException('This question has already been answered');
    }

    let isCorrect: boolean;
    let feedback: string;

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // For MC just compare — no need to call Claude
      isCorrect = dto.userAnswer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase();
      feedback = isCorrect
        ? `Correct! ${question.explanation}`
        : `Not quite. The correct answer is: "${question.correctAnswer}". ${question.explanation}`;
    } else {
      // Open-ended / short answer — let Claude evaluate
      const evaluation = await this.aiService.evaluateAnswer({
        userId,
        question: question.question,
        correctAnswer: question.correctAnswer,
        userAnswer: dto.userAnswer,
        sourceExcerpt: question.sourceExcerpt ?? '',
      });
      isCorrect = evaluation.isCorrect;
      feedback = evaluation.feedback;
    }

    // Save result
    await this.questionRepo.update(question.id, {
      userAnswer: dto.userAnswer,
      isCorrect,
    });

    return {
      isCorrect,
      feedback,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  // ─── Finish session ──────────────────────────────────────────────────────────

  async finishSession(userId: string, sessionId: string): Promise<QuizSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Quiz session not found');

    const questions = await this.questionRepo.find({ where: { quizSessionId: sessionId } });
    const answered = questions.filter(q => q.isCorrect !== null && q.isCorrect !== undefined);
    const correct = answered.filter(q => q.isCorrect).length;
    const score = answered.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    await this.sessionRepo.update(sessionId, {
      correctAnswers: correct,
      score,
      totalQuestions: questions.length,
    });

    // Update streak: increment if last active was yesterday, reset if gap > 1 day, keep if already today
    await this.dataSource.query(
      `UPDATE users SET
         "streak" = CASE
           WHEN "lastActiveDate" = CURRENT_DATE THEN streak
           WHEN "lastActiveDate" = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
           ELSE 1
         END,
         "lastActiveDate" = CURRENT_DATE
       WHERE id = $1`,
      [userId],
    ).catch(() => {});

    return this.sessionRepo.findOne({ where: { id: sessionId } }) as Promise<QuizSession>;
  }

  // ─── Get a session with questions ────────────────────────────────────────────

  async getSession(userId: string, sessionId: string): Promise<QuizSession & { questions: QuizQuestion[] }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Quiz session not found');

    const questions = await this.questionRepo.find({
      where: { quizSessionId: sessionId },
    });

    return { ...session, questions };
  }

  // ─── Quiz history ────────────────────────────────────────────────────────────

  async getHistory(userId: string): Promise<QuizSession[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
