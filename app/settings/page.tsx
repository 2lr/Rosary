import { redirect } from 'next/navigation';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import SettingsScreen from '@/components/SettingsScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const bloom = bloomFrom(await getStats(user.id), user.id);

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={user.lang} />
      <SettingsScreen
        user={{ email: user.email, displayName: user.displayName, lang: user.lang }}
      />
    </>
  );
}
