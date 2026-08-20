import { redirect } from 'next/navigation';
import HomeScreen from '@/components/HomeScreen';
import BloomVars from '@/components/BloomVars';
import HtmlLang from '@/components/HtmlLang';
import { getCurrentUser } from '@/lib/auth/guard';
import { findOpenRosary } from '@/lib/db/rosaries';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';
import { mysterySetForDate } from '@/lib/rosary/mysteries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const [stats, openRosary] = await Promise.all([getStats(user.id), findOpenRosary(user.id)]);
  const bloom = bloomFrom(stats, user.id);

  return (
    <>
      <BloomVars bloom={bloom} />
      <HtmlLang lang={user.lang} />
      <HomeScreen
        user={{ displayName: user.displayName, lang: user.lang }}
        stats={stats}
        bloom={bloom}
        openRosary={openRosary}
        todaysSet={mysterySetForDate(new Date())}
      />
    </>
  );
}
