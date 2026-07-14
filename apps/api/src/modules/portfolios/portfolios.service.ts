import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Portfolio } from '@cryptotrade/database';

import { PortfolioRepository, PortfolioWithTradeCount } from './repositories/portfolio.repository';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

@Injectable()
export class PortfoliosService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async findAll(userId: string): Promise<PortfolioWithTradeCount[]> {
    return this.portfolioRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string): Promise<PortfolioWithTradeCount> {
    const portfolio = await this.portfolioRepository.findById(id);

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    this.assertOwnership(portfolio, userId);

    return portfolio;
  }

  async getDefaultForUser(userId: string): Promise<Portfolio | null> {
    return this.portfolioRepository.findDefaultForUser(userId);
  }

  async create(userId: string, dto: CreatePortfolioDto): Promise<Portfolio> {
    if (dto.isDefault) {
      await this.portfolioRepository.unsetDefaultForUser(userId);
    }

    return this.portfolioRepository.create({
      ...dto,
      userId,
    });
  }

  async update(id: string, userId: string, dto: UpdatePortfolioDto): Promise<Portfolio> {
    await this.findOne(id, userId);

    if (dto.isDefault) {
      await this.portfolioRepository.unsetDefaultForUser(userId, id);
    }

    return this.portfolioRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<Portfolio> {
    await this.findOne(id, userId);

    const tradeCount = await this.portfolioRepository.countTrades(id);

    if (tradeCount > 0) {
      throw new ConflictException(
        'Cannot delete a portfolio that still has trades. Reassign or delete them first.',
      );
    }

    return this.portfolioRepository.delete(id);
  }

  private assertOwnership(portfolio: Portfolio, userId: string): void {
    if (portfolio.userId !== userId) {
      throw new ForbiddenException('You do not have access to this portfolio');
    }
  }
}
