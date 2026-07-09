import { getTranslations } from 'next-intl/server';

export default async function NotFoundPage() {
  const t = await getTranslations('common');

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-muted-foreground">{t('appName')}</p>
    </div>
  );
}
