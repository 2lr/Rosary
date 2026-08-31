import type { Lang } from '@/lib/i18n/config';

/**
 * The mail that lets somebody back in.
 *
 * Deliberately plain. A message about an account is the one people are most
 * often phished with, so it says what was asked for, offers one link, and says
 * what happens if it was not them — nothing else, no artwork, no invitation.
 *
 * It never says whether the address has an account. This mail is only ever
 * sent to one that does, so its mere arrival says so; but the reply the app
 * gives the person who typed the address says nothing either way.
 */

export type Notice = { subject: string; text: string; html: string };

const WORDS: Record<
  Lang,
  { subject: string; opening: string; button: string; expiry: string; ignore: string }
> = {
  fr: {
    subject: 'Retrouver l’accès à votre compte',
    opening: 'Vous avez demandé à choisir un nouveau mot de passe.',
    button: 'Choisir un mot de passe',
    expiry: 'Ce lien ne fonctionne qu’une fois, et pendant une heure.',
    ignore:
      'Si ce n’est pas vous qui l’avez demandé, il n’y a rien à faire : votre mot de passe actuel reste valable et ce lien expirera tout seul.',
  },
  en: {
    subject: 'Getting back into your account',
    opening: 'You asked to choose a new password.',
    button: 'Choose a password',
    expiry: 'This link works once, and for one hour.',
    ignore:
      'If you did not ask for this, there is nothing to do: your current password still works and this link will expire on its own.',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resetNotice(input: { lang: Lang; token: string; appUrl: string }): Notice {
  const w = WORDS[input.lang];
  const url = `${input.appUrl.replace(/\/+$/, '')}/reset?token=${encodeURIComponent(input.token)}`;

  const text = [w.opening, '', url, '', w.expiry, '', w.ignore].join('\n');

  const html = `<div style="margin:0;padding:24px;background:#f6f2ea;font-family:Georgia,'Times New Roman',serif;color:#2c2622">
  <div style="max-width:520px;margin:0 auto;background:#fbf8f3;border:1px solid #e6ddcd;border-radius:20px;padding:28px">
    <p style="margin:0 0 22px;font-size:17px;line-height:1.6">${escapeHtml(w.opening)}</p>
    <p style="margin:0">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#3f5296;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">${escapeHtml(w.button)}</a>
    </p>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#8a7f6d">${escapeHtml(w.expiry)}</p>
    <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#9b9184">${escapeHtml(w.ignore)}</p>
  </div>
</div>`;

  return { subject: w.subject, text, html };
}
