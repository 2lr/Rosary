import { handle, json } from '@/lib/api';
import { requireUser } from '@/lib/auth/guard';
import { normalizeLang } from '@/lib/i18n/config';
import { fetchGospel, todayKey } from '@/lib/rosary/gospel';

/**
 * The gospel of the day, fetched here rather than while rendering the page: a
 * third party being slow should never delay the rosary itself. The card asks
 * for this once the screen is already up, and stays away if it does not answer.
 */
export async function GET(request: Request) {
  return handle(async () => {
    // Signed in only. The readings are public, but there is no reason to let
    // this become an open proxy onto someone else's API.
    await requireUser();

    const url = new URL(request.url);
    const lang = normalizeLang(url.searchParams.get('lang') ?? 'fr');

    // Only ever today: a date from the query string would let a caller walk the
    // whole liturgical calendar through us.
    const gospel = await fetchGospel(todayKey(), lang);

    return json({ gospel });
  });
}
