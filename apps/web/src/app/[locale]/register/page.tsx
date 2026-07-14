import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthCard, GuestOnly, RegisterForm } from '@/components/auth';

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('auth.register');

  return (
    <GuestOnly>
      <AuthCard title={t('title')} description={t('subtitle')}>
        <RegisterForm />
      </AuthCard>
    </GuestOnly>
  );
}
