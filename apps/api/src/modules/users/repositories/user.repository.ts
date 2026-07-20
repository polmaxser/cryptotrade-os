import { Injectable } from '@nestjs/common';
import { Prisma, Subscription, User } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

export type UserWithSubscription = User & { subscription: Subscription | null };

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(
    data: Prisma.UserUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return (tx ?? this.prisma).user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async findByIdWithSubscription(id: string): Promise<UserWithSubscription | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async findManyForAdmin(
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<UserWithSubscription[]> {
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countForAdmin(search: string | undefined): Promise<number> {
    return this.prisma.user.count({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }
}
