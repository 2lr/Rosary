import { handle, json } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { getStats } from '@/lib/db/stats';
import { bloomFrom } from '@/lib/rosary/growth';
import { preferencesOf } from '@/lib/rosary/preferences';

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const stats = await getStats(user.id);
    return json({ stats, bloom: bloomFrom(stats, user.id, preferencesOf(user)) });
  });
}
