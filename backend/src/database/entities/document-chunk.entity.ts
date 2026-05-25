import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity('document_chunks')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  documentId!: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document!: Document;

  @Column('text')
  content!: string;

  // pgvector column — stored as raw SQL via migration
  // TypeORM doesn't natively support vector type, so we use a workaround
  @Column({ type: 'text', nullable: true, select: false })
  embeddingRaw!: string | null;

  @Column({ type: 'int' })
  chunkIndex!: number;

  @Column({ nullable: true })
  pageNumber!: number | null;
}
