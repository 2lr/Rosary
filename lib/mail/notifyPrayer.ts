import 'server-only';
import { NOTICES_PER_DAY, noticeRefusal, noticeSentFor, recordNotice } from '@/lib/db/notices';
import { inviteCodeOf } from '@/lib/db/users';
import { prayerNotice } from '@/lib/mail/prayerNotice';
import { appUrl, sendMail } from '@/lib/mail/send';
import { verseFor } from '@/lib/mail/verses';
import type { Rosary } from '@/lib/rosary/types';

/**
 * Telling somebody a rosary was prayed for them.
 *
 * Called once, when the rosary is finished — never when it is begun, because
 * the mail says it happened. Every outcome is written down, including the ones
 * where nothing goes out, so that "did it send?" has an answer.
 *
 * It never throws. Somebody finishing a chaplet must not see an error because
 * a mail server refused a connection.
 */
export async function notifyPrayer(
  rosary: Rosary,
  userId: string,
  /** The origin the rosary was finished from, used for the link. */
  origin?: string | null,
): Promise<void> {
  const email = rosary.notifyEmail?.trim().toLowerCase();
  if (!email) return;

  try {
    // Rosaries are saved on every bead, so the finished state can arrive more
    // than once. One rosary, one word.
    if (await noticeSentFor(rosary.id)) return;

    const refusal = await noticeRefusal(userId, email);
    if (refusal) {
      await recordNotice({
        userId,
        rosaryId: rosary.id,
        email,
        lang: rosary.lang,
        verse: '',
        status: refusal,
        error: refusal === 'too_many' ? `over ${NOTICES_PER_DAY} in a day` : null,
      });
      return;
    }

    const base = appUrl(origin);
    const code = await inviteCodeOf(userId);
    if (!base || !code) {
      await recordNotice({
        userId,
        rosaryId: rosary.id,
        email,
        lang: rosary.lang,
        verse: '',
        status: 'unconfigured',
        error: base ? 'no invite code' : 'no address for the app',
      });
      return;
    }

    const verse = verseFor(email, new Date().toISOString().slice(0, 10));
    const notice = prayerNotice({ lang: rosary.lang, verse, code, appUrl: base });
    const result = await sendMail({ to: email, ...notice });

    await recordNotice({
      userId,
      rosaryId: rosary.id,
      email,
      lang: rosary.lang,
      verse: verse.ref.en,
      status: result.status,
      error: result.error ?? null,
    });
  } catch {
    // Already past the point where this could be reported anywhere useful.
  }
}
