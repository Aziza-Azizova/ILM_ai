import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { Document, DocumentStatus } from '../../database/entities/document.entity';
import { DocumentChunk } from '../../database/entities/document-chunk.entity';
import { AiService } from '../ai/ai.service';

const CHUNK_SIZE = 500;       // tokens (approximate chars * 0.75)
const CHUNK_OVERLAP = 50;     // overlap between chunks to preserve context

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(DocumentChunk) private chunkRepo: Repository<DocumentChunk>,
    private aiService: AiService,
    private dataSource: DataSource,
  ) {}

  async uploadDocument(params: {
    userId: string;
    topicId?: string;
    file: Express.Multer.File;
  }): Promise<Document> {
    const doc = this.docRepo.create({
      userId: params.userId,
      topicId: params.topicId,
      filename: params.file.filename,
      originalName: params.file.originalname,
      filePath: params.file.path,
      mimeType: params.file.mimetype,
      status: DocumentStatus.PENDING,
    });
    await this.docRepo.save(doc);

    // Process asynchronously — don't await
    this.processDocument(doc.id).catch(err =>
      this.logger.error(`Processing failed for doc ${doc.id}`, err),
    );

    return doc;
  }

  async uploadTextContent(params: {
    userId: string;
    topicId?: string;
    content: string;
    title: string;
  }): Promise<Document> {
    const filename = `${Date.now()}-${params.title.replace(/\s+/g, '-')}.txt`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    fs.writeFileSync(filePath, params.content, 'utf8');

    const doc = this.docRepo.create({
      userId: params.userId,
      topicId: params.topicId,
      filename,
      originalName: `${params.title}.txt`,
      filePath,
      mimeType: 'text/plain',
      status: DocumentStatus.PENDING,
    });
    await this.docRepo.save(doc);

    this.processDocument(doc.id).catch(err =>
      this.logger.error(`Processing failed for doc ${doc.id}`, err),
    );

    return doc;
  }

  async processDocument(docId: string): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id: docId } });
    if (!doc) return;

    await this.docRepo.update(docId, { status: DocumentStatus.PROCESSING });

    try {
      const text = await this.extractText(doc);
      const chunks = this.chunkText(text);

      // Embed and save chunks in DB transaction
      await this.dataSource.transaction(async manager => {
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await this.aiService.embed(chunks[i]);
          // Store embedding as pgvector using raw SQL (TypeORM doesn't support vector type)
          await manager.query(
            `INSERT INTO document_chunks ("documentId", content, embedding, "chunkIndex")
             VALUES ($1, $2, $3::vector, $4)`,
            [docId, chunks[i], `[${embedding.join(',')}]`, i],
          );
        }
        await manager.update(Document, docId, {
          status: DocumentStatus.READY,
          chunkCount: chunks.length,
        });
      });

      this.logger.log(`Document ${docId} processed: ${chunks.length} chunks`);
    } catch (err) {
      this.logger.error(`Document ${docId} processing error`, err);
      await this.docRepo.update(docId, {
        status: DocumentStatus.FAILED,
        errorMessage: err.message,
      });
    }
  }

  private async extractText(doc: Document): Promise<string> {
    const buffer = fs.readFileSync(doc.filePath);

    if (doc.mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (
      doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      doc.mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Plain text
    return buffer.toString('utf8');
  }

  private chunkText(text: string): string[] {
    // Split on sentence boundaries, then group into ~CHUNK_SIZE word chunks
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + CHUNK_SIZE, words.length);
      chunks.push(words.slice(start, end).join(' '));
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks.filter(c => c.trim().length > 20); // skip tiny fragments
  }

  // ─── Semantic Search ─────────────────────────────────────────────────────────

  async semanticSearch(params: {
    userId: string;
    query: string;
    topicId?: string;
    limit?: number;
  }): Promise<Array<{ chunkId: string; content: string; documentName: string; score: number }>> {
    const embedding = await this.aiService.embed(params.query);
    const vectorStr = `[${embedding.join(',')}]`;
    const limit = params.limit ?? 5;

    let sql = `
      SELECT
        dc.id as "chunkId",
        dc.content,
        d."originalName" as "documentName",
        1 - (dc.embedding <=> $1::vector) as score
      FROM document_chunks dc
      JOIN documents d ON dc."documentId" = d.id
      WHERE d."userId" = $2
        AND d.status = 'ready'
    `;
    const params_arr: any[] = [vectorStr, params.userId];

    if (params.topicId) {
      sql += ` AND d."topicId" = $3`;
      params_arr.push(params.topicId);
      sql += ` ORDER BY dc.embedding <=> $1::vector LIMIT $4`;
      params_arr.push(limit);
    } else {
      sql += ` ORDER BY dc.embedding <=> $1::vector LIMIT $3`;
      params_arr.push(limit);
    }

    return this.dataSource.query(sql, params_arr);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async findByUser(userId: string, topicId?: string) {
    const where: any = { userId };
    if (topicId) where.topicId = topicId;
    return this.docRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string) {
    const doc = await this.docRepo.findOne({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string, userId: string) {
    const doc = await this.findOne(id, userId);
    if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
    await this.docRepo.remove(doc);
    return { success: true };
  }
}
