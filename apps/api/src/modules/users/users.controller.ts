import { Body, Controller, Get, Patch } from '@nestjs/common';

import { type UsersService } from './users.service';
import { type UpdateUserDto } from './dto/update-user.dto';
import { type PublicUser } from './types/public-user';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string): Promise<PublicUser> {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.usersService.updateProfile(userId, dto);
  }
}
