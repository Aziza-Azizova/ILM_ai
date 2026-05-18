import {
  Controller, Get, Post, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50 MB
          new FileTypeValidator({
            fileType: /(pdf|msword|vnd\.openxmlformats|plain|text)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
    @Body('topicId') topicId?: string,
  ) {
    return this.documentsService.uploadDocument({
      userId: user.id,
      topicId,
      file,
    });
  }

  @Post('text')
  uploadText(
    @CurrentUser() user: User,
    @Body() body: { content: string; title: string; topicId?: string },
  ) {
    return this.documentsService.uploadTextContent({
      userId: user.id,
      topicId: body.topicId,
      content: body.content,
      title: body.title,
    });
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query('topicId') topicId?: string) {
    return this.documentsService.findByUser(user.id, topicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.remove(id, user.id);
  }
}
