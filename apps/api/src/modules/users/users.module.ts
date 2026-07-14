import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';

import { DatabaseModule } from '@/common/database/database.module';

@Module({
  imports: [DatabaseModule],

  controllers: [UsersController],

  providers: [UsersService, UserRepository],

  exports: [UsersService, UserRepository],
})
export class UsersModule {}
