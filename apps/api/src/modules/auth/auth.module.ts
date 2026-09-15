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
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PortfoliosModule,
    BillingModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('auth.accessTokenSecret');

        if (!secret) {
          throw new Error(
            'JWT_ACCESS_SECRET is not set — required to sign access tokens securely.',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get<number>('auth.accessTokenTtlSeconds', 900),
          },
        };
      },
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
