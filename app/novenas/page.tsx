import { redirect } from 'next/navigation';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import NovenasScreen from '@/components/NovenasScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';
import { preferencesOf } from '@/lib/rosary/preferences';

export const dynamic = 'force-dynamic';

export default async function NovenasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const stats = await getStats(user.id);
  const bloom = bloomFrom(stats, user.id, preferencesOf(user));

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={user.lang} />
      <NovenasScreen lang={user.lang} stats={stats} />
    </>
  );
}
