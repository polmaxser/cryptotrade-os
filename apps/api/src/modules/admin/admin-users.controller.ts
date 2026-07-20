import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { AdminGuard } from '@/modules/auth/guards/admin.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { AdminUsersService } from './admin-users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async list(@Query() query: ListUsersDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Patch(':id/status')
  async setStatus(
    @CurrentUser('id') actingAdminId: string,
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.setUserStatus(actingAdminId, userId, dto);
  }
}
