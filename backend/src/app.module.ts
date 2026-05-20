import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { TopicsModule } from './modules/topics/topics.module';
import { UsersModule } from './modules/users/users.module';

import { QuizModule } from './modules/quiz/quiz.module';
// Week 2+ modules — uncomment as we build them:
// import { PlansModule } from './modules/plans/plans.module';
// import { GapsModule } from './modules/gaps/gaps.module';
// import { TelegramModule } from './modules/telegram/telegram.module';
// import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AiModule,
    DocumentsModule,
    ChatModule,
    TopicsModule,
    UsersModule,
    QuizModule,
  ],
})
export class AppModule {}
