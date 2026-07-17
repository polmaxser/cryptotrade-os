import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { AiReportsService } from './ai-reports.service';
import { ListAiReportsDto } from './dto/list-ai-reports.dto';
import { GenerateAiReportDto } from './dto/generate-ai-report.dto';

@Controller('ai-reports')
export class AiReportsController {
  constructor(private readonly aiReportsService: AiReportsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: ListAiReportsDto) {
    return this.aiReportsService.listForUser(userId, query.type);
  }

  @Get(':id')
  async getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.aiReportsService.getOne(id, userId);
  }

  @Post('generate')
  async generate(@CurrentUser('id') userId: string, @Body() dto: GenerateAiReportDto) {
    return this.aiReportsService.generateNow(userId, dto.type);
  }
}
