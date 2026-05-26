import { apiClient } from './client';

export type QuizDifficulty = 'gentle' | 'solid' | 'expert';
export type QuestionType = 'multiple_choice' | 'short_answer' | 'open_ended';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;   // Only filled in after answering
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
  sourceExcerpt?: string;
}

export interface QuizSession {
  id: string;
  topicId?: string;
  difficulty: QuizDifficulty;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
  questions?: QuizQuestion[];
}

export interface AnswerFeedback {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  explanation: string;
}

export interface StartQuizParams {
  topicId?: string;
  difficulty: QuizDifficulty;
  questionCount: number;
}

export type ActiveQuizSession = QuizSession & { questions: QuizQuestion[] };

export const quizApi = {
  /** Start a new quiz session — returns session + questions (correct answers hidden) */
  start: async (params: StartQuizParams): Promise<ActiveQuizSession> => {
    const { data } = await apiClient.post('/quiz/start', params);
    return data;
  },

  /** Submit an answer for one question */
  submitAnswer: async (
    sessionId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<AnswerFeedback> => {
    const { data } = await apiClient.post(`/quiz/${sessionId}/answer`, {
      questionId,
      userAnswer,
    });
    return data;
  },

  /** Close the session and compute the final score */
  finish: async (sessionId: string): Promise<QuizSession> => {
    const { data } = await apiClient.post(`/quiz/${sessionId}/finish`);
    return data;
  },

  /** Get full session with all questions (for review) */
  getSession: async (sessionId: string): Promise<ActiveQuizSession> => {
    const { data } = await apiClient.get(`/quiz/${sessionId}`);
    return data;
  },

  /** Past sessions */
  getHistory: async (): Promise<QuizSession[]> => {
    const { data } = await apiClient.get('/quiz/history');
    return data;
  },
};
