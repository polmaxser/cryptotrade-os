import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '@/modules/users/repositories/user.repository';

import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminUserSummary, toAdminUserSummary } from './types/admin-user-summary';
import { Paginated } from './types/paginated';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class AdminUsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers(dto: ListUsersDto): Promise<Paginated<AdminUserSummary>> {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.userRepository.findManyForAdmin(dto.search, skip, pageSize),
      this.userRepository.countForAdmin(dto.search),
    ]);

    return {
      items: users.map(toAdminUserSummary),
      total,
      page,
      pageSize,
    };
  }

  async setUserStatus(
    actingAdminId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<AdminUserSummary> {
    if (userId === actingAdminId && !dto.isActive) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, { isActive: dto.isActive });

    const refreshed = await this.userRepository.findByIdWithSubscription(userId);
    if (!refreshed) {
      throw new NotFoundException('User not found');
    }

    return toAdminUserSummary(refreshed);
  }
}
