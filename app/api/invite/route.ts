import { handle, json } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { inviteCodeOf, lineageOf } from '@/lib/db/users';

/**
 * Somebody's own code, and what has been prayed by the people they let in.
 *
 * The code is minted here if the account predates codes, so every user has one
 * to give the first time they go looking for it.
 */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const [code, lineage] = await Promise.all([inviteCodeOf(user.id), lineageOf(user.id)]);
    return json({ code, ...lineage });
  });
}
