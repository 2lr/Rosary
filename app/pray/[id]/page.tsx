import { notFound, redirect } from 'next/navigation';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import PrayScreen from '@/components/PrayScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { findRosary } from '@/lib/db/rosaries';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';
import { preferencesOf } from '@/lib/rosary/preferences';

export const dynamic = 'force-dynamic';

export default async function PrayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const { id } = await params;
  const rosary = await findRosary(id, user.id);
  if (!rosary) notFound();

  const stats = await getStats(user.id);
  const bloom = bloomFrom(stats, user.id, preferencesOf(user));

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={rosary.lang} />
      <PrayScreen
        rosary={rosary}
        bloom={bloom}
        stats={stats}
        preferences={preferencesOf(user)}
        hailMary={user.hailMary}
      />
    </>
  );
}
