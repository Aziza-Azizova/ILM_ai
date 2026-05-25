import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../../database/entities/topic.entity';

@Injectable()
export class TopicsService {
  constructor(@InjectRepository(Topic) private topicRepo: Repository<Topic>) {}

  async create(
    userId: string,
    dto: { name: string; description?: string },
  ): Promise<Topic> {
    const topic = this.topicRepo.create({ userId, ...dto });
    return this.topicRepo.save(topic);
  }

  async findAll(userId: string): Promise<Topic[]> {
    return this.topicRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Topic> {
    const topic = await this.topicRepo.findOne({ where: { id, userId } });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  async update(
    id: string,
    userId: string,
    dto: { name?: string; description?: string },
  ): Promise<Topic> {
    const topic = await this.findOne(id, userId);
    Object.assign(topic, dto);
    return this.topicRepo.save(topic);
  }

  async remove(id: string, userId: string): Promise<{ success: boolean }> {
    const topic = await this.findOne(id, userId);
    await this.topicRepo.remove(topic);
    return { success: true };
  }
}
