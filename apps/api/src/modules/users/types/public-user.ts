import { User } from '@cryptotrade/database';

export type PublicUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, twoFactorSecret: _twoFactorSecret, ...publicUser } = user;

  return publicUser;
}
