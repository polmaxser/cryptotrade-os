import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

import { DatabaseModule } from '@/common/database/database.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.accessTokenSecret', 'dev-access-secret-change-me'),
        signOptions: {
          expiresIn: configService.get<number>('auth.accessTokenTtlSeconds', 900),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenRepository,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],

  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
