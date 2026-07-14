import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { PublicUser } from '@/modules/users/types/public-user';

import { AuthService, RequestMeta, TwoFactorChallenge, TwoFactorSetup } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';
import { TwoFactorVerifyDto } from './dto/two-factor-verify.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_PATH = '/api/v1/auth';

interface AuthResponseBody {
  user: PublicUser;
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseBody> {
    const { user, tokens } = await this.authService.register(dto, this.extractMeta(req));

    this.setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseBody | TwoFactorChallenge> {
    const result = await this.authService.login(dto, this.extractMeta(req));

    if ('requiresTwoFactor' in result) {
      return result;
    }

    this.setRefreshTokenCookie(
      res,
      result.tokens.refreshToken,
      result.tokens.refreshTokenExpiresAt,
    );

    return { user: result.user, accessToken: result.tokens.accessToken };
  }

  @Public()
  @Post('2fa/verify')
  async verifyTwoFactor(
    @Body() dto: TwoFactorVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseBody> {
    const { user, tokens } = await this.authService.verifyTwoFactor(
      dto.challengeToken,
      dto.code,
      this.extractMeta(req),
    );

    this.setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return { user, accessToken: tokens.accessToken };
  }

  @Post('2fa/setup')
  async setupTwoFactor(@CurrentUser('id') userId: string): Promise<TwoFactorSetup> {
    return this.authService.setupTwoFactor(userId);
  }

  @Post('2fa/enable')
  async enableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ success: true }> {
    await this.authService.enableTwoFactor(userId, dto.code);

    return { success: true };
  }

  @Post('2fa/disable')
  async disableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ success: true }> {
    await this.authService.disableTwoFactor(userId, dto.code);

    return { success: true };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseBody> {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { user, tokens } = await this.authService.refresh(rawRefreshToken, this.extractMeta(req));

    this.setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_PATH });

    return { success: true };
  }

  private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';

    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: this.configService.get<string>('auth.cookieDomain'),
      path: REFRESH_TOKEN_PATH,
      expires: expiresAt,
    });
  }

  private extractMeta(req: Request): RequestMeta {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }
}
