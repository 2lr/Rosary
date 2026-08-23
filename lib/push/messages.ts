import type { Lang } from '@/lib/i18n/config';

/**
 * What a reminder actually says.
 *
 * Two of them, and both are written to be read on a lock screen and then acted
 * on or dismissed — not to nag. The first asks a question somebody can answer
 * in one tap because the home screen now records a chaplet in one tap. The
 * second is not about the reader at all: it is what other people prayed
 * because they are there, which is the only number in this app worth being
 * told rather than looked up.
 *
 * Pure, so what goes to a lock screen can be read in a test.
 */

export type PushMessage = {
  title: string;
  body: string;
  /** Where tapping it lands. */
  url: string;
  /** Notifications sharing a tag replace one another rather than stacking. */
  tag: string;
};

export function dailyReminder(lang: Lang): PushMessage {
  return {
    title: lang === 'fr' ? 'Votre chapelet' : 'Your chaplet',
    body:
      lang === 'fr'
        ? 'Avez-vous prié aujourd’hui ? Un tap suffit à le noter.'
        : 'Have you prayed today? One tap writes it down.',
    url: '/home',
    tag: 'daily',
  };
}

export function lineageReport(
  lang: Lang,
  count: { rosaries: number; decades: number },
): PushMessage {
  const { rosaries, decades } = count;
  return {
    title: lang === 'fr' ? 'Votre lignée a prié' : 'Your line prayed',
    body:
      lang === 'fr'
        ? rosaries === 1
          ? `Un rosaire a été prié aujourd’hui grâce à vous — ${decades} dizaines.`
          : `${rosaries} rosaires ont été priés aujourd’hui grâce à vous — ${decades} dizaines.`
        : rosaries === 1
          ? `One rosary was prayed today because of you — ${decades} decades.`
          : `${rosaries} rosaries were prayed today because of you — ${decades} decades.`,
    url: '/journey',
    tag: 'lineage',
  };
}
