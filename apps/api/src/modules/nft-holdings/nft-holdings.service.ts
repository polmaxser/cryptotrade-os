import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NftHolding } from '@cryptotrade/database';

import { PortfoliosService } from '@/modules/portfolios/portfolios.service';

import { NftHoldingRepository } from './repositories/nft-holding.repository';
import { CreateNftHoldingDto } from './dto/create-nft-holding.dto';
import { UpdateNftHoldingDto } from './dto/update-nft-holding.dto';

@Injectable()
export class NftHoldingsService {
  constructor(
    private readonly holdingRepository: NftHoldingRepository,
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async listForUser(userId: string, portfolioId?: string): Promise<NftHolding[]> {
    return this.holdingRepository.findAllByUser(userId, portfolioId);
  }

  async create(userId: string, dto: CreateNftHoldingDto): Promise<NftHolding> {
    const portfolioId = await this.portfoliosService.resolvePortfolioId(userId, dto.portfolioId);

    return this.holdingRepository.create({ ...dto, userId, portfolioId });
  }

  async update(id: string, userId: string, dto: UpdateNftHoldingDto): Promise<NftHolding> {
    await this.getHoldingOrThrow(id, userId);

    if (dto.portfolioId) {
      await this.portfoliosService.findOne(dto.portfolioId, userId);
    }

    return this.holdingRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getHoldingOrThrow(id, userId);
    await this.holdingRepository.delete(id);
  }

  private async getHoldingOrThrow(id: string, userId: string): Promise<NftHolding> {
    const holding = await this.holdingRepository.findById(id);

    if (!holding) {
      throw new NotFoundException('NFT holding not found');
    }

    if (holding.userId !== userId) {
      throw new ForbiddenException('You do not have access to this NFT holding');
    }

    return holding;
  }
}
