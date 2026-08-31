import { handle, json } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { recentNotices } from '@/lib/db/notices';

/** What became of the last words this person sent. Their own sends, nobody else's. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({ notices: await recentNotices(user.id) });
  });
}
