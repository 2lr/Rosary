import type { Lang } from '@/lib/i18n/config';

/**
 * One line of the New Testament, to go with the word that somebody prayed.
 *
 * These are transcribed from the two public-domain translations the app already
 * leans on: Louis Segond (1910) in French, the World English Bible in English.
 * Anything published in the last century belongs to whoever made it, and a mail
 * going out to strangers is the last place to be casual about that.
 *
 * Chosen for one job: to be read once, on a phone, by somebody who did not ask
 * for it and does not know who prayed. So they are short, they are addressed to
 * the reader rather than about doctrine, and none of them asks anything of him.
 *
 * If a wording here has drifted from its edition, that is mine to correct.
 */

export type Verse = {
  /** The reference, as it is printed under the line. */
  ref: Record<Lang, string>;
  text: Record<Lang, string>;
};

export const VERSES: Verse[] = [
  {
    ref: { fr: 'Matthieu 11, 28', en: 'Matthew 11:28' },
    text: {
      fr: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
      en: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    },
  },
  {
    ref: { fr: 'Jean 14, 27', en: 'John 14:27' },
    text: {
      fr: 'Je vous laisse la paix, je vous donne ma paix. Que votre cœur ne se trouble point.',
      en: 'Peace I leave with you. My peace I give to you. Don’t let your heart be troubled.',
    },
  },
  {
    ref: { fr: 'Jean 16, 33', en: 'John 16:33' },
    text: {
      fr: 'Prenez courage, j’ai vaincu le monde.',
      en: 'Cheer up! I have overcome the world.',
    },
  },
  {
    ref: { fr: 'Romains 8, 28', en: 'Romans 8:28' },
    text: {
      fr: 'Toutes choses concourent au bien de ceux qui aiment Dieu.',
      en: 'All things work together for good for those who love God.',
    },
  },
  {
    ref: { fr: 'Romains 8, 39', en: 'Romans 8:39' },
    text: {
      fr: 'Rien ne pourra nous séparer de l’amour de Dieu manifesté en Jésus-Christ notre Seigneur.',
      en: 'Nothing will be able to separate us from God’s love which is in Christ Jesus our Lord.',
    },
  },
  {
    ref: { fr: 'Philippiens 4, 6', en: 'Philippians 4:6' },
    text: {
      fr: 'Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu.',
      en: 'In nothing be anxious, but in everything let your requests be made known to God.',
    },
  },
  {
    ref: { fr: 'Philippiens 4, 13', en: 'Philippians 4:13' },
    text: {
      fr: 'Je puis tout par celui qui me fortifie.',
      en: 'I can do all things through Christ, who strengthens me.',
    },
  },
  {
    ref: { fr: '1 Pierre 5, 7', en: '1 Peter 5:7' },
    text: {
      fr: 'Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.',
      en: 'Cast all your worries on him, because he cares for you.',
    },
  },
  {
    ref: { fr: 'Matthieu 6, 34', en: 'Matthew 6:34' },
    text: {
      fr: 'Ne vous inquiétez pas du lendemain : à chaque jour suffit sa peine.',
      en: 'Don’t be anxious for tomorrow. Each day’s own evil is sufficient.',
    },
  },
  {
    ref: { fr: 'Luc 1, 37', en: 'Luke 1:37' },
    text: {
      fr: 'Rien n’est impossible à Dieu.',
      en: 'Nothing spoken by God is impossible.',
    },
  },
  {
    ref: { fr: 'Jean 8, 12', en: 'John 8:12' },
    text: {
      fr: 'Celui qui me suit ne marchera pas dans les ténèbres, mais il aura la lumière de la vie.',
      en: 'He who follows me will not walk in the darkness, but will have the light of life.',
    },
  },
  {
    ref: { fr: 'Matthieu 5, 4', en: 'Matthew 5:4' },
    text: {
      fr: 'Heureux les affligés, car ils seront consolés.',
      en: 'Blessed are those who mourn, for they shall be comforted.',
    },
  },
  {
    ref: { fr: '2 Corinthiens 12, 9', en: '2 Corinthians 12:9' },
    text: {
      fr: 'Ma grâce te suffit, car ma puissance s’accomplit dans la faiblesse.',
      en: 'My grace is sufficient for you, for my power is made perfect in weakness.',
    },
  },
  {
    ref: { fr: 'Matthieu 28, 20', en: 'Matthew 28:20' },
    text: {
      fr: 'Et voici, je suis avec vous tous les jours, jusqu’à la fin du monde.',
      en: 'Behold, I am with you always, even to the end of the age.',
    },
  },
  {
    ref: { fr: 'Hébreux 13, 8', en: 'Hebrews 13:8' },
    text: {
      fr: 'Jésus-Christ est le même hier, aujourd’hui, et éternellement.',
      en: 'Jesus Christ is the same yesterday, today, and forever.',
    },
  },
  {
    ref: { fr: '1 Corinthiens 13, 7', en: '1 Corinthians 13:7' },
    text: {
      fr: 'L’amour excuse tout, il croit tout, il espère tout, il supporte tout.',
      en: 'Love bears all things, believes all things, hopes all things, endures all things.',
    },
  },
  {
    ref: { fr: 'Romains 15, 13', en: 'Romans 15:13' },
    text: {
      fr: 'Que le Dieu de l’espérance vous remplisse de toute joie et de toute paix.',
      en: 'Now may the God of hope fill you with all joy and peace.',
    },
  },
  {
    ref: { fr: '1 Jean 4, 18', en: '1 John 4:18' },
    text: {
      fr: 'La crainte n’est pas dans l’amour, mais l’amour parfait bannit la crainte.',
      en: 'There is no fear in love; but perfect love casts out fear.',
    },
  },
  {
    ref: { fr: 'Jacques 1, 17', en: 'James 1:17' },
    text: {
      fr: 'Tout don parfait descend d’en haut, du Père des lumières.',
      en: 'Every perfect gift is from above, coming down from the Father of lights.',
    },
  },
  {
    ref: { fr: '2 Timothée 1, 7', en: '2 Timothy 1:7' },
    text: {
      fr: 'Dieu ne nous a pas donné un esprit de timidité, mais un esprit de force, d’amour et de sagesse.',
      en: 'God didn’t give us a spirit of fear, but of power, love, and self-control.',
    },
  },
  {
    ref: { fr: 'Apocalypse 21, 4', en: 'Revelation 21:4' },
    text: {
      fr: 'Il essuiera toute larme de leurs yeux.',
      en: 'He will wipe away every tear from their eyes.',
    },
  },
  {
    ref: { fr: 'Matthieu 7, 7', en: 'Matthew 7:7' },
    text: {
      fr: 'Demandez, et l’on vous donnera ; cherchez, et vous trouverez ; frappez, et l’on vous ouvrira.',
      en: 'Ask, and it will be given you. Seek, and you will find. Knock, and it will be opened for you.',
    },
  },
  {
    ref: { fr: '1 Thessaloniciens 5, 16', en: '1 Thessalonians 5:16' },
    text: {
      fr: 'Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses.',
      en: 'Always rejoice. Pray without ceasing. In everything give thanks.',
    },
  },
  {
    ref: { fr: 'Éphésiens 3, 20', en: 'Ephesians 3:20' },
    text: {
      fr: 'À celui qui peut faire infiniment au-delà de tout ce que nous demandons ou pensons.',
      en: 'To him who is able to do exceedingly abundantly above all that we ask or think.',
    },
  },
];

/** A small, stable hash. Two addresses should not share a day's verse. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * The verse for one person on one day.
 *
 * Where in the list they start is theirs; how far along depends on the day, so
 * somebody prayed for on two days running never gets the same line twice, and
 * the whole list comes round before anything repeats.
 */
export function verseFor(email: string, day: string): Verse {
  const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const offset = Number.isFinite(days) ? days : 0;
  const index = (((hash(email.trim().toLowerCase()) + offset) % VERSES.length) + VERSES.length) % VERSES.length;
  return VERSES[index];
}
