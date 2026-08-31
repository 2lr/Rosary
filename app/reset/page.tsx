import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import ResetScreen from '@/components/ResetScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { langFromAcceptLanguage } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

/**
 * Where the link in the mail lands.
 *
 * The token stays in the address and is never read here: it is handed to the
 * browser, which sends it back when the password is chosen. Nothing is looked
 * up on the way in, so a stale link costs a page and no more.
 */
export default async function ResetPage() {
  // Somebody already signed in has no business here; they can change nothing
  // by this route that the settings do not offer.
  if (await getCurrentUser()) redirect('/home');

  const lang = langFromAcceptLanguage((await headers()).get('accept-language'));
  return <ResetScreen initialLang={lang} />;
}
