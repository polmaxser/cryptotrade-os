import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma, type User } from '@cryptotrade/database';

import { type UserRepository } from './repositories/user.repository';
import { type UpdateUserDto } from './dto/update-user.dto';
import { type PublicUser, toPublicUser } from './types/public-user';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(user);
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    await this.findById(id);

    const user = await this.userRepository.update(id, dto);

    return toPublicUser(user);
  }

  /**
   * Returns the full user record including passwordHash.
   * Reserved for the auth module — never expose this beyond it.
   */
  async findAuthUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Returns the full user record including passwordHash.
   * Reserved for the auth module — never expose this beyond it.
   */
  async findAuthUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.userRepository.create(data);
  }
}
