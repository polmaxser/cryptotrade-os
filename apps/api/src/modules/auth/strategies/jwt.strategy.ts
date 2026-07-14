import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '@/modules/users/users.service';
import { PublicUser, toPublicUser } from '@/modules/users/types/public-user';

import { AccessTokenPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'auth.accessTokenSecret',
        'dev-access-secret-change-me',
      ),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<PublicUser> {
    // Rejects 2FA challenge tokens (and anything else) masquerading as an access token —
    // without this check a stolen/leaked challenge token would bypass the second factor entirely.
    if (payload.purpose !== 'access') {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findAuthUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return toPublicUser(user);
  }
}
