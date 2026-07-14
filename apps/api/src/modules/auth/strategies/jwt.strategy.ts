import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type UsersService } from '@/modules/users/users.service';
import { type PublicUser, toPublicUser } from '@/modules/users/types/public-user';

interface JwtPayload {
  sub: string;
}

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

  async validate(payload: JwtPayload): Promise<PublicUser> {
    const user = await this.usersService.findAuthUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return toPublicUser(user);
  }
}
