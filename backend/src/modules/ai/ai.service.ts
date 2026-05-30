import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { LlmLog } from '../../database/entities/llm-log.entity';
import {
  COMPANION_SYSTEM_PROMPT,
  QUIZ_SYSTEM_PROMPT,
} from './prompts/companion.prompt';

export interface GeneratedQuestion {
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'open_ended';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceExcerpt: string;
}

const QUESTION_TYPES = new Set([
  'multiple_choice',
  'short_answer',
  'open_ended',
]);

function isGeneratedQuestion(val: unknown): val is GeneratedQuestion {
  if (typeof val !== 'object' || val === null) return false;
  const q = val as Record<string, unknown>;
  return (
    typeof q.question === 'string' &&
    typeof q.type === 'string' &&
    QUESTION_TYPES.has(q.type) &&
    typeof q.correctAnswer === 'string' &&
    typeof q.explanation === 'string' &&
    typeof q.sourceExcerpt === 'string' &&
    (q.options === undefined || Array.isArray(q.options))
  );
}

function isGeneratedQuestionArray(val: unknown): val is GeneratedQuestion[] {
  return Array.isArray(val) && val.every(isGeneratedQuestion);
}

function isEvalResult(
  val: unknown,
): val is { isCorrect: boolean; feedback: string } {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return typeof r.isCorrect === 'boolean' && typeof r.feedback === 'string';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private _claude: Anthropic | null = null;
  private _openai: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    @InjectRepository(LlmLog) private logRepo: Repository<LlmLog>,
  ) {}

  // Lazy getters — clients are created on first use so missing keys don't crash startup.
  // Calls will fail with a clear error message when a key is actually needed.
  private get claude(): Anthropic {
    if (!this._claude) {
      const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in .env');
      this._claude = new Anthropic({ apiKey });
    }
    return this._claude;
  }

  private get openai(): OpenAI {
    if (!this._openai) {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set in .env');
      this._openai = new OpenAI({ apiKey });
    }
    return this._openai;
  }

  // ─── Embeddings ──────────────────────────────────────────────────────────────

  async embed(text: string): Promise<number[]> {
    const start = Date.now();
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // safety trim
      });
      await this.log({
        provider: 'openai',
        model: 'text-embedding-3-small',
        feature: 'embedding',
        promptTokens: response.usage.prompt_tokens,
        completionTokens: 0,
        latencyMs: Date.now() - start,
      });
      return response.data[0].embedding;
    } catch (err) {
      this.logger.error('Embedding failed', err);
      throw err;
    }
  }

  // ─── Streaming Chat ───────────────────────────────────────────────────────────

  async *streamChat(params: {
    userId: string;
    context: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    userMessage: string;
  }): AsyncGenerator<string> {
    const systemPrompt = COMPANION_SYSTEM_PROMPT.replace(
      '{context}',
      params.context,
    );

    const messages: Anthropic.MessageParam[] = [
      ...params.history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: params.userMessage },
    ];

    const start = Date.now();
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const stream = this.claude.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
        if (event.type === 'message_delta' && event.usage) {
          completionTokens = event.usage.output_tokens;
        }
        if (event.type === 'message_start' && event.message.usage) {
          promptTokens = event.message.usage.input_tokens;
        }
      }

      await this.log({
        userId: params.userId,
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        feature: 'chat',
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - start,
      });
    } catch (err) {
      await this.log({
        userId: params.userId,
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        feature: 'chat',
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // ─── Quiz Generation ─────────────────────────────────────────────────────────

  async generateQuiz(params: {
    userId: string;
    context: string;
    difficulty: 'gentle' | 'solid' | 'expert';
    questionCount: number;
  }): Promise<GeneratedQuestion[]> {
    const systemPrompt = QUIZ_SYSTEM_PROMPT.replace(
      '{context}',
      params.context,
    );
    const userPrompt = `Generate exactly ${params.questionCount} questions at "${params.difficulty}" difficulty. Return ONLY the JSON array, no other text.`;

    const start = Date.now();
    try {
      const response = await this.claude.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';

      await this.log({
        userId: params.userId,
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        feature: 'quiz',
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        latencyMs: Date.now() - start,
      });

      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed: unknown = JSON.parse(cleaned);
      if (!isGeneratedQuestionArray(parsed)) {
        throw new Error('AI returned an unexpected quiz structure');
      }
      return parsed;
    } catch (err) {
      this.logger.error('Quiz generation failed', err);
      throw err;
    }
  }

  // ─── Answer Evaluation ────────────────────────────────────────────────────────

  async evaluateAnswer(params: {
    userId: string;
    question: string;
    correctAnswer: string;
    userAnswer: string;
    sourceExcerpt: string;
  }): Promise<{ isCorrect: boolean; feedback: string }> {
    const prompt = `Question: ${params.question}
Correct answer: ${params.correctAnswer}
User's answer: ${params.userAnswer}
Source material excerpt: ${params.sourceExcerpt}

Evaluate the user's answer. Is it correct or substantially correct?
Respond with valid JSON: { "isCorrect": true/false, "feedback": "explanation of what was right/wrong and reference to the source" }`;

    const start = Date.now();
    const response = await this.claude.messages.create({
      model: 'claude-haiku-4-5', // cheaper model for evaluation
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '{}';
    await this.log({
      userId: params.userId,
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      feature: 'quiz_eval',
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      latencyMs: Date.now() - start,
    });

    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed: unknown = JSON.parse(cleaned);
    if (!isEvalResult(parsed)) {
      throw new Error('AI returned an unexpected evaluation structure');
    }
    return parsed;
  }

  // ─── Logging ─────────────────────────────────────────────────────────────────

  private async log(data: Partial<LlmLog>) {
    try {
      await this.logRepo.save(this.logRepo.create(data));
    } catch {
      // Never let logging crash the app
    }
  }
}
