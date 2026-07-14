import { setRequestLocale } from 'next-intl/server';
import { InvitationAcceptView } from '@/components/workspaces/invitation-accept-view';

type InvitationPageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  return <InvitationAcceptView token={token} />;
}
