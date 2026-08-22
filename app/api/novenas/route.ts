import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { listNovenas, startNovena, stopNovena } from '@/lib/db/novenas';
import { NOVENA_KEYS } from '@/lib/rosary/novenas';

type Body = { novena?: string; startedOn?: string; stop?: boolean };

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return json({ novenas: await listNovenas(user.id) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    if (typeof body.novena !== 'string' || !NOVENA_KEYS.includes(body.novena)) {
      return fail('unknown_novena');
    }
    if (typeof body.startedOn !== 'string' || !DAY_KEY.test(body.startedOn)) {
      return fail('invalid_date');
    }
    // A real day, and one within reach of now: a novena is nine days of one's
    // own life, not an entry in a chronicle.
    const day = new Date(`${body.startedOn}T00:00:00Z`);
    if (Number.isNaN(day.getTime())) return fail('invalid_date');
    const months = Math.abs(day.getTime() - Date.now()) / 2_592_000_000;
    if (months > 18) return fail('invalid_date');

    if (body.stop === true) await stopNovena(user.id, body.novena, body.startedOn);
    else await startNovena(user.id, body.novena, body.startedOn);

    return json({ novenas: await listNovenas(user.id) });
  });
}
