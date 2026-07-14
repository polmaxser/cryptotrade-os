export interface AccessTokenPayload {
  sub: string;
  purpose: 'access';
}

export interface TwoFactorChallengePayload {
  sub: string;
  purpose: '2fa_challenge';
}
