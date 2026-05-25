import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1000000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Users
    await queryRunner.query(`
      CREATE TYPE user_plan_enum AS ENUM ('free', 'premium');
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        name VARCHAR,
        "passwordHash" VARCHAR,
        "googleId" VARCHAR,
        plan user_plan_enum NOT NULL DEFAULT 'free',
        "telegramChatId" VARCHAR,
        "goalText" TEXT,
        "goalDate" DATE,
        "reminderTime" VARCHAR,
        streak INT NOT NULL DEFAULT 0,
        "lastActiveDate" DATE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Topics
    await queryRunner.query(`
      CREATE TABLE topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Documents
    await queryRunner.query(`
      CREATE TYPE document_status_enum AS ENUM ('pending', 'processing', 'ready', 'failed');
      CREATE TABLE documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "topicId" UUID REFERENCES topics(id) ON DELETE SET NULL,
        filename VARCHAR NOT NULL,
        "originalName" VARCHAR NOT NULL,
        "filePath" VARCHAR NOT NULL,
        "mimeType" VARCHAR NOT NULL DEFAULT 'text/plain',
        status document_status_enum NOT NULL DEFAULT 'pending',
        "errorMessage" TEXT,
        "chunkCount" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Document chunks with pgvector embedding column (1536 dims = text-embedding-3-small)
    await queryRunner.query(`
      CREATE TABLE document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "documentId" UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(1536),
        "chunkIndex" INT NOT NULL,
        "pageNumber" INT
      )
    `);

    // Index for fast cosine similarity search
    await queryRunner.query(`
      CREATE INDEX document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    `);

    // Chat sessions
    await queryRunner.query(`
      CREATE TABLE chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "topicId" UUID REFERENCES topics(id) ON DELETE SET NULL,
        title VARCHAR,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Chat messages
    await queryRunner.query(`
      CREATE TYPE message_role_enum AS ENUM ('user', 'assistant');
      CREATE TABLE chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "chatSessionId" UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role message_role_enum NOT NULL,
        content TEXT NOT NULL,
        "sourceChunks" JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Quiz sessions
    await queryRunner.query(`
      CREATE TYPE quiz_difficulty_enum AS ENUM ('gentle', 'solid', 'expert');
      CREATE TABLE quiz_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "topicId" UUID REFERENCES topics(id) ON DELETE SET NULL,
        difficulty quiz_difficulty_enum NOT NULL DEFAULT 'gentle',
        score FLOAT NOT NULL DEFAULT 0,
        "totalQuestions" INT NOT NULL DEFAULT 0,
        "correctAnswers" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Quiz questions
    await queryRunner.query(`
      CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'short_answer', 'open_ended');
      CREATE TABLE quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "quizSessionId" UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        type question_type_enum NOT NULL,
        options JSONB,
        "correctAnswer" TEXT NOT NULL,
        "userAnswer" TEXT,
        "isCorrect" BOOLEAN,
        explanation TEXT,
        "sourceChunkId" UUID,
        "sourceExcerpt" TEXT
      )
    `);

    // Subscriptions
    await queryRunner.query(`
      CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "stripeCustomerId" VARCHAR,
        "stripeSubscriptionId" VARCHAR,
        status subscription_status_enum NOT NULL DEFAULT 'active',
        "currentPeriodEnd" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Usage tracking (free tier limits)
    await queryRunner.query(`
      CREATE TABLE usage_daily (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        "quizSessionsCount" INT NOT NULL DEFAULT 0,
        "uploadsCount" INT NOT NULL DEFAULT 0,
        UNIQUE("userId", date)
      )
    `);

    // Learning plans
    await queryRunner.query(`
      CREATE TABLE learning_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "planJson" JSONB NOT NULL,
        "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Gap reports
    await queryRunner.query(`
      CREATE TABLE gap_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "reportJson" JSONB NOT NULL,
        "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // LLM logs (monitoring)
    await queryRunner.query(`
      CREATE TABLE llm_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID,
        provider VARCHAR NOT NULL,
        model VARCHAR NOT NULL,
        feature VARCHAR NOT NULL,
        "promptTokens" INT NOT NULL DEFAULT 0,
        "completionTokens" INT NOT NULL DEFAULT 0,
        "latencyMs" INT NOT NULL DEFAULT 0,
        error VARCHAR,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS llm_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS gap_reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS learning_plans`);
    await queryRunner.query(`DROP TABLE IF EXISTS usage_daily`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_questions`);
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_sessions`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS document_chunks_embedding_idx`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS document_chunks`);
    await queryRunner.query(`DROP TABLE IF EXISTS documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS topics`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS question_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS quiz_difficulty_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS message_role_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_plan_enum`);
  }
}
