import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { LlmLog } from '../../database/entities/llm-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LlmLog])],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
