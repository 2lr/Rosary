import type { Lang } from '@/lib/i18n/config';
import type { Verse } from '@/lib/mail/verses';

/**
 * The mail somebody gets when a rosary was prayed for them.
 *
 * Three things and no more: that it happened, one line of the New Testament to
 * carry the day, and a way in if they want one. It is written in the language
 * the rosary was prayed in, because that is the only clue we have.
 *
 * What it deliberately does not carry: who prayed, and what for. The intention
 * is the one thing said between somebody and God, and it does not go out over
 * email — nor does the name of whoever wrote it. The link carries their
 * invitation code, which is what lets the recipient in and what quietly puts
 * them in that person's line; it says nothing about whose code it is.
 *
 * Pure, so that what goes out can be read in a test rather than in an inbox.
 */

export type Notice = { subject: string; text: string; html: string };

const WORDS: Record<
  Lang,
  {
    subject: string;
    opening: string;
    body: string;
    invitation: string;
    button: string;
    footer: string;
  }
> = {
  fr: {
    subject: 'Quelqu’un a prié pour vous aujourd’hui',
    opening: 'Aujourd’hui, quelqu’un a prié un chapelet pour vous.',
    body: 'Cette personne a préféré ne pas dire son nom. Elle a simplement voulu que vous le sachiez.',
    invitation: 'Si vous voulez prier à votre tour, ce lien vous ouvre l’application.',
    button: 'Ouvrir Rosaire',
    footer:
      'Vous recevez ce message une seule fois, parce que quelqu’un a donné votre adresse en priant. Rien n’est enregistré à votre sujet et il n’y a rien à désinscrire.',
  },
  en: {
    subject: 'Somebody prayed for you today',
    opening: 'Today somebody prayed a rosary for you.',
    body: 'They chose not to give their name. They only wanted you to know.',
    invitation: 'If you would like to pray in turn, this link opens the app.',
    button: 'Open Rosary',
    footer:
      'You are getting this once, because somebody gave your address while praying. Nothing about you is kept and there is nothing to unsubscribe from.',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function prayerNotice(input: {
  lang: Lang;
  verse: Verse;
  /** The praying user's own invitation code, carried by the link. */
  code: string;
  /** Where the app lives, without a trailing slash. */
  appUrl: string;
}): Notice {
  const { lang, verse, code } = input;
  const w = WORDS[lang];
  const url = `${input.appUrl.replace(/\/+$/, '')}/?code=${encodeURIComponent(code)}`;
  const line = verse.text[lang];
  const ref = verse.ref[lang];

  const text = [
    w.opening,
    '',
    `« ${line} »`,
    `— ${ref}`,
    '',
    w.body,
    '',
    w.invitation,
    url,
    '',
    w.footer,
  ].join('\n');

  // Inline styles and a table-free layout: every client renders this the same,
  // and there is nothing here that needs a stylesheet to be read.
  const html = `<div style="margin:0;padding:24px;background:#f6f2ea;font-family:Georgia,'Times New Roman',serif;color:#2c2622">
  <div style="max-width:520px;margin:0 auto;background:#fbf8f3;border:1px solid #e6ddcd;border-radius:20px;padding:28px">
    <p style="margin:0;font-size:17px;line-height:1.6">${escapeHtml(w.opening)}</p>
    <blockquote style="margin:22px 0;padding:0 0 0 16px;border-left:2px solid #c9b892;font-size:19px;line-height:1.6;font-style:italic">
      ${escapeHtml(line)}
      <div style="margin-top:8px;font-size:13px;font-style:normal;color:#8a7f6d">${escapeHtml(ref)}</div>
    </blockquote>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#5b5348">${escapeHtml(w.body)}</p>
    <p style="margin:22px 0 12px;font-size:15px;line-height:1.6;color:#5b5348">${escapeHtml(w.invitation)}</p>
    <p style="margin:0">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#3f5296;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">${escapeHtml(w.button)}</a>
    </p>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#9b9184">${escapeHtml(w.footer)}</p>
  </div>
</div>`;

  return { subject: w.subject, text, html };
}
