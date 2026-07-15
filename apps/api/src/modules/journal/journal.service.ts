import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JournalTag, JournalTagCategory } from '@cryptotrade/database';

import { TradesService } from '@/modules/trades/trades.service';
import { StorageService } from '@/modules/storage/storage.service';

import { JournalEntryRepository } from './repositories/journal-entry.repository';
import { JournalTagRepository } from './repositories/journal-tag.repository';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { CreateJournalTagDto } from './dto/create-journal-tag.dto';
import { JournalEntryWithRelations } from './types/journal-entry-with-relations';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class JournalService {
  constructor(
    private readonly entryRepository: JournalEntryRepository,
    private readonly tagRepository: JournalTagRepository,
    private readonly tradesService: TradesService,
    private readonly storageService: StorageService,
  ) {}

  async listTags(userId: string, category?: JournalTagCategory): Promise<JournalTag[]> {
    return this.tagRepository.findAllByUser(userId, category);
  }

  async createTag(userId: string, dto: CreateJournalTagDto): Promise<JournalTag> {
    const name = dto.name.trim();
    const existing = await this.tagRepository.findByName(userId, dto.category, name);

    if (existing) {
      throw new ConflictException('You already have a tag with this name in this category');
    }

    return this.tagRepository.create({ userId, name, category: dto.category });
  }

  async deleteTag(id: string, userId: string): Promise<void> {
    await this.getTagOrThrow(id, userId);
    await this.tagRepository.delete(id);
  }

  async listEntries(
    userId: string,
    filters: { tradeId?: string; tagId?: string },
  ): Promise<JournalEntryWithRelations[]> {
    return this.entryRepository.findAllByUser(userId, filters);
  }

  async getEntry(id: string, userId: string): Promise<JournalEntryWithRelations> {
    return this.getEntryOrThrow(id, userId);
  }

  async createEntry(
    userId: string,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryWithRelations> {
    if (dto.tradeId) {
      await this.tradesService.findOne(dto.tradeId, userId);
    }

    const tagIds = dto.tagIds ?? [];
    if (tagIds.length > 0) {
      await this.assertTagsOwnedByUser(tagIds, userId);
    }

    return this.entryRepository.create(
      { userId, content: dto.content, tradeId: dto.tradeId },
      tagIds,
    );
  }

  async updateEntry(
    id: string,
    userId: string,
    dto: UpdateJournalEntryDto,
  ): Promise<JournalEntryWithRelations> {
    await this.getEntryOrThrow(id, userId);

    if (dto.tradeId) {
      await this.tradesService.findOne(dto.tradeId, userId);
    }

    if (dto.tagIds) {
      await this.assertTagsOwnedByUser(dto.tagIds, userId);
    }

    return this.entryRepository.update(
      id,
      { content: dto.content, tradeId: dto.tradeId },
      dto.tagIds,
    );
  }

  async deleteEntry(id: string, userId: string): Promise<void> {
    const entry = await this.getEntryOrThrow(id, userId);

    await Promise.all(
      entry.screenshotUrls.map((url) =>
        this.storageService.deleteByUrl(url).catch(() => undefined),
      ),
    );

    await this.entryRepository.delete(id);
  }

  async addScreenshot(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<JournalEntryWithRelations> {
    await this.getEntryOrThrow(id, userId);
    this.assertValidImage(file);

    const url = await this.storageService.uploadImage(
      file.buffer,
      file.mimetype,
      `journal/${userId}`,
    );

    return this.entryRepository.addScreenshotUrl(id, url);
  }

  async removeScreenshot(
    id: string,
    userId: string,
    url: string,
  ): Promise<JournalEntryWithRelations> {
    const entry = await this.getEntryOrThrow(id, userId);

    if (!entry.screenshotUrls.includes(url)) {
      throw new NotFoundException('This screenshot does not belong to this entry');
    }

    await this.storageService.deleteByUrl(url).catch(() => undefined);

    const remaining = entry.screenshotUrls.filter((existing) => existing !== url);
    return this.entryRepository.setScreenshotUrls(id, remaining);
  }

  private assertValidImage(file: Express.Multer.File): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, or GIF images are allowed');
    }
  }

  private async assertTagsOwnedByUser(tagIds: string[], userId: string): Promise<void> {
    const tags = await this.tagRepository.findByIds(tagIds);

    if (tags.length !== tagIds.length) {
      throw new NotFoundException('One or more tags were not found');
    }

    if (tags.some((tag) => tag.userId !== userId)) {
      throw new ForbiddenException('You do not have access to one or more of these tags');
    }
  }

  private async getEntryOrThrow(id: string, userId: string): Promise<JournalEntryWithRelations> {
    const entry = await this.entryRepository.findById(id);

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have access to this journal entry');
    }

    return entry;
  }

  private async getTagOrThrow(id: string, userId: string): Promise<JournalTag> {
    const tag = await this.tagRepository.findById(id);

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException('You do not have access to this tag');
    }

    return tag;
  }
}
