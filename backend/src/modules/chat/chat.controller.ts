import {
  Controller, Get, Post, Param, Body, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('sessions')
  createSession(
    @CurrentUser() user: User,
    @Body() body: { topicId?: string },
  ) {
    return this.chatService.createSession(user.id, body.topicId);
  }

  @Get('sessions')
  getSessions(@CurrentUser() user: User) {
    return this.chatService.getSessions(user.id);
  }

  @Get('sessions/:sessionId/messages')
  getMessages(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.getMessages(sessionId, user.id);
  }

  /**
   * SSE streaming endpoint.
   * Client connects with: new EventSource('/chat/sessions/:id/stream?message=...')
   * Or via POST with manual SSE headers (used here for auth token in header).
   */
  @Post('sessions/:sessionId/stream')
  async streamMessage(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
    @Body() body: { message: string },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.chatService.streamMessage({
        sessionId,
        userId: user.id,
        userMessage: body.message,
      })) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
