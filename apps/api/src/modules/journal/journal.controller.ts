import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { ListJournalEntriesDto } from './dto/list-journal-entries.dto';
import { CreateJournalTagDto } from './dto/create-journal-tag.dto';
import { ListJournalTagsDto } from './dto/list-journal-tags.dto';
import { RemoveScreenshotDto } from './dto/remove-screenshot.dto';

const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('tags')
  async listTags(@CurrentUser('id') userId: string, @Query() query: ListJournalTagsDto) {
    return this.journalService.listTags(userId, query.category);
  }

  @Post('tags')
  async createTag(@CurrentUser('id') userId: string, @Body() dto: CreateJournalTagDto) {
    return this.journalService.createTag(userId, dto);
  }

  @Delete('tags/:id')
  async deleteTag(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.journalService.deleteTag(id, userId);
    return { success: true };
  }

  @Get('entries')
  async listEntries(@CurrentUser('id') userId: string, @Query() query: ListJournalEntriesDto) {
    return this.journalService.listEntries(userId, query);
  }

  @Get('entries/:id')
  async getEntry(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.journalService.getEntry(id, userId);
  }

  @Post('entries')
  async createEntry(@CurrentUser('id') userId: string, @Body() dto: CreateJournalEntryDto) {
    return this.journalService.createEntry(userId, dto);
  }

  @Patch('entries/:id')
  async updateEntry(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalService.updateEntry(id, userId, dto);
  }

  @Delete('entries/:id')
  async deleteEntry(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.journalService.deleteEntry(id, userId);
    return { success: true };
  }

  @Post('entries/:id/screenshots')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SCREENSHOT_SIZE_BYTES } }))
  async uploadScreenshot(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.journalService.addScreenshot(id, userId, file);
  }

  @Delete('entries/:id/screenshots')
  async removeScreenshot(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RemoveScreenshotDto,
  ) {
    return this.journalService.removeScreenshot(id, userId, dto.url);
  }
}
