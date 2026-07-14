import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthCard, GuestOnly, LoginForm } from '@/components/auth';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('auth.login');

  return (
    <GuestOnly>
      <AuthCard title={t('title')} description={t('subtitle')}>
        <LoginForm />
      </AuthCard>
    </GuestOnly>
  );
}
