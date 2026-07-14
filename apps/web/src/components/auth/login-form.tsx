'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginRequest, verifyTwoFactorRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { isTwoFactorChallenge } from '@/types/auth';
import { useAuthStore } from '@/stores/auth-store';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tTwoFactor = useTranslations('auth.twoFactor');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginRequest({ email, password });

      if (isTwoFactorChallenge(result)) {
        setChallengeToken(result.challengeToken);
      } else {
        setSession(result.user, result.accessToken);
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tErrors('generic'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeToken) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await verifyTwoFactorRequest(challengeToken, code);
      setSession(res.user, res.accessToken);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tErrors('generic'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (challengeToken) {
    return (
      <form onSubmit={handleCodeSubmit} className="space-y-5">
        <p className="text-muted-foreground text-sm">{tTwoFactor('loginPrompt')}</p>

        <div className="space-y-2">
          <Label htmlFor="code">{tTwoFactor('codeLabel')}</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : tTwoFactor('verify')}
        </Button>

        <button
          type="button"
          className="text-muted-foreground w-full text-center text-sm underline-offset-4 hover:underline"
          onClick={() => {
            setChallengeToken(null);
            setCode('');
            setError(null);
          }}
        >
          {tTwoFactor('backToLogin')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {t('registerLink')}
        </Link>
      </p>
    </form>
  );
}
