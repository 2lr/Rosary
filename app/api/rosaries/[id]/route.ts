import { fail, handle, json, readJson } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { notifyPrayer } from '@/lib/mail/notifyPrayer';
import { deleteRosary, findRosary, saveProgress } from '@/lib/db/rosaries';
import {
  buildSequence,
  countCompletedDecades,
  countHailMarys,
  totalDecades,
} from '@/lib/rosary/sequence';
import type { RosaryProgress, RosaryStatus } from '@/lib/rosary/types';

const MAX_WRITING = 4000;
const MAX_INTENTION = 500;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const rosary = await findRosary((await params).id, user.id);
    if (!rosary) return fail('not_found', 404);
    return json({ rosary });
  });
}

type Body = {
  step?: number;
  done?: number[];
  writings?: Record<string, string>;
  status?: RosaryStatus;
  intention?: string | null;
};

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;

    const rosary = await findRosary(id, user.id);
    if (!rosary) return fail('not_found', 404);

    const body = await readJson<Body>(request);
    if (!body) return fail('invalid_body');

    // A finished rosary is a record of what was prayed: it stays closed.
    if (rosary.status === 'completed') return fail('already_completed', 409);

    // Rebuild the sequence server-side so counts can never be inflated by the
    // client: only step ids that actually exist are accepted.
    const steps = buildSequence({
      kind: rosary.kind,
      mysterySet: rosary.mysterySet,
      mode: rosary.mode,
      lang: rosary.lang,
    });
    const valid = new Set(steps.map((s) => s.id));

    const done = new Set<number>(
      (Array.isArray(body.done) ? body.done : rosary.progress.done).filter(
        (n) => typeof n === 'number' && valid.has(n),
      ),
    );

    const writings: Record<string, string> = { ...rosary.progress.writings };
    if (body.writings && typeof body.writings === 'object') {
      for (const [key, value] of Object.entries(body.writings)) {
        if (!valid.has(Number(key))) continue;
        if (typeof value !== 'string') continue;
        const trimmed = value.slice(0, MAX_WRITING);
        if (trimmed) writings[key] = trimmed;
        else delete writings[key];
      }
    }

    const step =
      typeof body.step === 'number' && body.step >= 0 && body.step < steps.length
        ? body.step
        : rosary.progress.step;

    const progress: RosaryProgress = { step, done: [...done].sort((a, b) => a - b), writings };
    const decades = countCompletedDecades(steps, done);

    let status: RosaryStatus = rosary.status;
    if (body.status === 'completed') status = 'completed';
    else if (body.status === 'abandoned') status = 'abandoned';
    else if (body.status === 'in_progress') status = 'in_progress';

    // Finishing is only meaningful once every decade has actually been prayed.
    if (status === 'completed' && decades < totalDecades(rosary.kind)) {
      return fail('incomplete', 409);
    }

    const intention =
      body.intention === undefined
        ? undefined
        : body.intention === null
          ? null
          : String(body.intention).trim().slice(0, MAX_INTENTION) || null;

    const updated = await saveProgress(id, user.id, {
      progress,
      decadesCompleted: decades,
      hailMarys: countHailMarys(steps, done),
      status,
      ...(intention === undefined ? {} : { intention }),
    });

    // The word to whoever was prayed for goes out here and nowhere else: the
    // moment the rosary is actually finished. A rosary already completed was
    // turned away further up, so this runs on the transition and no other time;
    // the notice table is the belt to that pair of braces.
    if (status === 'completed' && updated) {
      await notifyPrayer(updated, user.id, originOf(request));
    }

    return json({ rosary: updated });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser();
    await deleteRosary((await params).id, user.id);
    return json({ ok: true });
  });
}

/**
 * The address this request came in on, for the link inside the mail.
 *
 * Behind Railway's proxy the request URL is the internal one, so the forwarded
 * headers are what say where the app actually answers.
 */
function originOf(request: Request): string | null {
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (!host) return null;
  const proto = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
