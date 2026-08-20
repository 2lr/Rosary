import { redirect } from 'next/navigation';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import SettingsScreen from '@/components/SettingsScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';
import { preferencesOf } from '@/lib/rosary/preferences';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const stats = await getStats(user.id);
  const bloom = bloomFrom(stats, user.id, preferencesOf(user));

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={user.lang} />
      <SettingsScreen
        user={{
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          lang: user.lang,
          colors: user.colors,
          shape: user.shape,
          hailMary: user.hailMary,
        }}
        stats={stats}
      />
    </>
  );
}
