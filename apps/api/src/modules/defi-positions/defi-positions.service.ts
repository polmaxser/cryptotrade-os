import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DeFiPosition } from '@cryptotrade/database';

import { PortfoliosService } from '@/modules/portfolios/portfolios.service';

import { DeFiPositionRepository } from './repositories/defi-position.repository';
import { CreateDeFiPositionDto } from './dto/create-defi-position.dto';
import { UpdateDeFiPositionDto } from './dto/update-defi-position.dto';

@Injectable()
export class DeFiPositionsService {
  constructor(
    private readonly positionRepository: DeFiPositionRepository,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async listForUser(userId: string, portfolioId?: string): Promise<DeFiPosition[]> {
    return this.positionRepository.findAllByUser(userId, portfolioId);
  }

  async create(userId: string, dto: CreateDeFiPositionDto): Promise<DeFiPosition> {
    const portfolioId = await this.portfoliosService.resolvePortfolioId(userId, dto.portfolioId);

    return this.positionRepository.create({ ...dto, userId, portfolioId });
  }

  async update(id: string, userId: string, dto: UpdateDeFiPositionDto): Promise<DeFiPosition> {
    await this.getPositionOrThrow(id, userId);

    if (dto.portfolioId) {
      await this.portfoliosService.findOne(dto.portfolioId, userId);
    }

    return this.positionRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getPositionOrThrow(id, userId);
    await this.positionRepository.delete(id);
  }

  private async getPositionOrThrow(id: string, userId: string): Promise<DeFiPosition> {
    const position = await this.positionRepository.findById(id);

    if (!position) {
      throw new NotFoundException('DeFi position not found');
    }

    if (position.userId !== userId) {
      throw new ForbiddenException('You do not have access to this DeFi position');
    }

    return position;
  }
}
