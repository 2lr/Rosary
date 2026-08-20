import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthScreen from '@/components/AuthScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { langFromAcceptLanguage } from '@/lib/i18n/config';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/home');

  const lang = langFromAcceptLanguage((await headers()).get('accept-language'));
  return <AuthScreen initialLang={lang} />;
}
