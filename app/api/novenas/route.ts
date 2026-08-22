import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { joinNovena, leaveNovena, listJoinedNovenas } from '@/lib/db/novenas';
import { NOVENA_KEYS } from '@/lib/rosary/novenas';

type Body = { novena?: string; year?: number; joined?: boolean };

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({ joined: await listJoinedNovenas(user.id) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    // Only novenas this app actually knows, and only years that make sense —
    // the key and the year together are the primary key of the row.
    if (typeof body.novena !== 'string' || !NOVENA_KEYS.includes(body.novena)) {
      return fail('unknown_novena');
    }
    if (typeof body.year !== 'number' || !Number.isInteger(body.year)) {
      return fail('invalid_year');
    }
    const thisYear = new Date().getUTCFullYear();
    if (body.year < thisYear - 1 || body.year > thisYear + 1) return fail('invalid_year');

    if (body.joined === false) await leaveNovena(user.id, body.novena, body.year);
    else await joinNovena(user.id, body.novena, body.year);

    return json({ joined: await listJoinedNovenas(user.id) });
  });
}
