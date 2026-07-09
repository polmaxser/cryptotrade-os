import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6 lg:px-8">
        {t('copyright', { year })}
      </div>
    </footer>
  );
}
