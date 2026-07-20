export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
};

export type TwoFactorChallenge = {
  requiresTwoFactor: true;
  challengeToken: string;
};

export type LoginResult = AuthResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(result: LoginResult): result is TwoFactorChallenge {
  return 'requiresTwoFactor' in result;
}

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};
