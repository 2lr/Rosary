import { redirect } from 'next/navigation';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import JourneyScreen from '@/components/JourneyScreen';
import { getCurrentUser } from '@/lib/auth/guard';
import { listRosaries } from '@/lib/db/rosaries';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';

export const dynamic = 'force-dynamic';

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const [stats, rosaries] = await Promise.all([getStats(user.id), listRosaries(user.id, 60)]);
  const bloom = bloomFrom(stats, user.id);

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={user.lang} />
      <JourneyScreen lang={user.lang} stats={stats} bloom={bloom} rosaries={rosaries} />
    </>
  );
}
