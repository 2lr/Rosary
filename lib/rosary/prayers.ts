import type { Lang } from '@/lib/i18n/config';

export type PrayerId =
  | 'signOfTheCross'
  | 'creed'
  | 'ourFather'
  | 'hailMary'
  | 'gloryBe'
  | 'fatima'
  | 'salveRegina'
  | 'closing';

export type Prayer = {
  id: PrayerId;
  /** Short label shown on the bead. */
  title: Record<Lang, string>;
  /** Full text, paragraph by paragraph. */
  text: Record<Lang, string[]>;
};

/**
 * Reference texts.
 *
 * French: the liturgical texts in use in France since the 2017 revision of the
 * Notre Père ("et ne nous laisse pas entrer en tentation") and the 2013
 * ecumenical Symbole des Apôtres.
 * English: the traditional forms used in the Roman Rite.
 */
export const PRAYERS: Record<PrayerId, Prayer> = {
  signOfTheCross: {
    id: 'signOfTheCross',
    title: { fr: 'Signe de croix', en: 'Sign of the Cross' },
    text: {
      fr: ['Au nom du Père, et du Fils, et du Saint-Esprit. Amen.'],
      en: ['In the name of the Father, and of the Son, and of the Holy Spirit. Amen.'],
    },
  },

  creed: {
    id: 'creed',
    title: { fr: 'Je crois en Dieu', en: 'The Apostles’ Creed' },
    text: {
      fr: [
        'Je crois en Dieu, le Père tout-puissant, Créateur du ciel et de la terre.',
        'Et en Jésus-Christ, son Fils unique, notre Seigneur, qui a été conçu du Saint-Esprit, est né de la Vierge Marie, a souffert sous Ponce Pilate, a été crucifié, est mort et a été enseveli, est descendu aux enfers, le troisième jour est ressuscité des morts, est monté aux cieux, est assis à la droite de Dieu le Père tout-puissant, d’où il viendra juger les vivants et les morts.',
        'Je crois en l’Esprit Saint, à la sainte Église catholique, à la communion des saints, à la rémission des péchés, à la résurrection de la chair, à la vie éternelle. Amen.',
      ],
      en: [
        'I believe in God, the Father almighty, Creator of heaven and earth,',
        'and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead.',
        'I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
      ],
    },
  },

  ourFather: {
    id: 'ourFather',
    title: { fr: 'Notre Père', en: 'Our Father' },
    text: {
      fr: [
        'Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, que ta volonté soit faite sur la terre comme au ciel.',
        'Donne-nous aujourd’hui notre pain de ce jour. Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. Et ne nous laisse pas entrer en tentation, mais délivre-nous du Mal. Amen.',
      ],
      en: [
        'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven.',
        'Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
      ],
    },
  },

  hailMary: {
    id: 'hailMary',
    title: { fr: 'Je vous salue, Marie', en: 'Hail Mary' },
    text: {
      fr: [
        'Je vous salue, Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes et Jésus, le fruit de vos entrailles, est béni.',
        'Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l’heure de notre mort. Amen.',
      ],
      en: [
        'Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus.',
        'Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
      ],
    },
  },

  gloryBe: {
    id: 'gloryBe',
    title: { fr: 'Gloire au Père', en: 'Glory Be' },
    text: {
      fr: [
        'Gloire au Père, et au Fils, et au Saint-Esprit, comme il était au commencement, maintenant et toujours, et dans les siècles des siècles. Amen.',
      ],
      en: [
        'Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.',
      ],
    },
  },

  fatima: {
    id: 'fatima',
    title: { fr: 'Ô mon Jésus', en: 'O My Jesus' },
    text: {
      fr: [
        'Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l’enfer, conduisez au ciel toutes les âmes, surtout celles qui ont le plus besoin de votre miséricorde.',
      ],
      en: [
        'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those in most need of Thy mercy.',
      ],
    },
  },

  salveRegina: {
    id: 'salveRegina',
    title: { fr: 'Salut, ô Reine', en: 'Hail, Holy Queen' },
    text: {
      fr: [
        'Salut, ô Reine, Mère de miséricorde, notre vie, notre douceur et notre espérance, salut ! Enfants d’Ève, exilés, nous crions vers vous ; vers vous nous soupirons, gémissant et pleurant dans cette vallée de larmes.',
        'Ô vous, notre avocate, tournez vers nous vos regards miséricordieux ; et après cet exil, montrez-nous Jésus, le fruit béni de vos entrailles, ô clémente, ô miséricordieuse, ô douce Vierge Marie. Amen.',
      ],
      en: [
        'Hail, holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears.',
        'Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Amen.',
      ],
    },
  },

  closing: {
    id: 'closing',
    title: { fr: 'Prière finale', en: 'Closing Prayer' },
    text: {
      fr: [
        'Prions. Dieu éternel et tout-puissant, dont le Fils unique, par sa vie, sa mort et sa résurrection, nous a acquis les récompenses du salut éternel : accorde-nous, en méditant ces mystères du très saint Rosaire de la Vierge Marie, d’imiter ce qu’ils contiennent et d’obtenir ce qu’ils promettent. Par le Christ, notre Seigneur. Amen.',
        'Au nom du Père, et du Fils, et du Saint-Esprit. Amen.',
      ],
      en: [
        'Let us pray. O God, whose only-begotten Son, by his life, death and resurrection, has purchased for us the rewards of eternal salvation: grant, we beseech thee, that meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise. Through Christ our Lord. Amen.',
        'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
      ],
    },
  },
};

/** The three virtues the opening Hail Marys are traditionally offered for. */
export const OPENING_VIRTUES: { fr: string; en: string }[] = [
  { fr: 'pour la foi', en: 'for faith' },
  { fr: 'pour l’espérance', en: 'for hope' },
  { fr: 'pour la charité', en: 'for charity' },
];

/**
 * Wordings of the Hail Mary.
 *
 * `traditional` is the form most people learned by heart: French keeps the
 * vouvoiement and "pleine de grâce", English keeps thee and thou. There is one
 * of it, because there is one of it.
 *
 * `contemporary` is not a single text. Several modern renderings are in real
 * use and they differ in ways that matter to the ear — "le fruit de tes
 * entrailles" or "de ton sein", "pauvres pécheurs" or "tes enfants", and the
 * literal "Réjouis-toi" for the angel's greeting. So the wording varies from
 * one decade to the next rather than being picked once and repeated
 * fifty-three times.
 *
 * There is no Latin here. The Ave Maria is the same prayer everywhere, but a
 * wall of Latin on a phone is not something you can pray from.
 */
export type HailMaryVariant = 'traditional' | 'contemporary';

export const HAIL_MARY_VARIANTS: HailMaryVariant[] = ['traditional', 'contemporary'];

export const DEFAULT_HAIL_MARY_VARIANT: HailMaryVariant = 'traditional';

export function isHailMaryVariant(value: unknown): value is HailMaryVariant {
  return typeof value === 'string' && (HAIL_MARY_VARIANTS as string[]).includes(value);
}

type Wording = {
  title: Record<Lang, string>;
  text: Record<Lang, string[]>;
};

type HailMaryChoice = {
  /** How the choice is named in the settings. */
  name: Record<Lang, string>;
  /** A word on what it is, so the choice is an informed one. */
  note: Record<Lang, string>;
  /** One or more renderings. More than one means it varies as you pray. */
  wordings: Wording[];
};

export const HAIL_MARY: Record<HailMaryVariant, HailMaryChoice> = {
  traditional: {
    name: { fr: 'Traditionnel', en: 'Traditional' },
    note: {
      fr: 'Celui que l’on récite depuis toujours, au vouvoiement.',
      en: 'The form most people learned by heart, with thee and thou.',
    },
    wordings: [
      {
        title: { fr: 'Je vous salue, Marie', en: 'Hail Mary' },
        text: {
          fr: [
            'Je vous salue, Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes et Jésus, le fruit de vos entrailles, est béni.',
            'Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l’heure de notre mort. Amen.',
          ],
          en: [
            'Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus.',
            'Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
          ],
        },
      },
    ],
  },

  contemporary: {
    name: { fr: 'Contemporain', en: 'Contemporary' },
    note: {
      fr: 'Les traductions modernes, au tutoiement. La formulation change d’une dizaine à l’autre.',
      en: 'The modern renderings, in plain speech. The wording changes from one decade to the next.',
    },
    wordings: [
      {
        title: { fr: 'Je te salue, Marie', en: 'Hail Mary' },
        text: {
          fr: [
            'Je te salue, Marie, comblée de grâce ; le Seigneur est avec toi. Tu es bénie entre toutes les femmes et Jésus, le fruit de tes entrailles, est béni.',
            'Sainte Marie, Mère de Dieu, prie pour nous, pauvres pécheurs, maintenant et à l’heure de notre mort. Amen.',
          ],
          en: [
            'Hail Mary, full of grace, the Lord is with you. Blessed are you among women, and blessed is the fruit of your womb, Jesus.',
            'Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
          ],
        },
      },
      {
        title: { fr: 'Je te salue, Marie', en: 'Hail Mary' },
        text: {
          fr: [
            'Je te salue, Marie, comblée de grâce ; le Seigneur est avec toi. Tu es bénie entre toutes les femmes et Jésus, le fruit de ton sein, est béni.',
            'Sainte Marie, Mère de Dieu, prie pour nous, tes enfants, maintenant et à l’heure de notre mort. Amen.',
          ],
          en: [
            'Hail Mary, full of grace, the Lord is with you. Blessed are you among women, and blessed is the fruit of your womb, Jesus.',
            'Holy Mary, Mother of God, pray for us your children, now and at the hour of our death. Amen.',
          ],
        },
      },
      {
        title: { fr: 'Réjouis-toi, Marie', en: 'Rejoice, Mary' },
        text: {
          fr: [
            'Réjouis-toi, Marie, comblée de grâce ; le Seigneur est avec toi. Tu es bénie entre toutes les femmes et Jésus, le fruit de ton sein, est béni.',
            'Sainte Marie, Mère de Dieu, prie pour nous, pécheurs, maintenant et à l’heure de notre mort. Amen.',
          ],
          en: [
            'Rejoice, Mary, full of grace, the Lord is with you. Blessed are you among women, and blessed is the fruit of your womb, Jesus.',
            'Holy Mary, Mother of God, pray for us, sinners, now and at the hour of our death. Amen.',
          ],
        },
      },
    ],
  },
};

/**
 * The prayer to show, with the chosen wording applied. Every prayer but the
 * Hail Mary is returned unchanged.
 *
 * `pick` selects among the renderings when there is more than one — pass the
 * decade, so the words are steady while you are praying that decade and
 * different in the next. Anything out of range simply wraps.
 */
export function prayerWith(
  id: PrayerId,
  variant: HailMaryVariant = DEFAULT_HAIL_MARY_VARIANT,
  pick = 0,
): Prayer {
  if (id !== 'hailMary') return PRAYERS[id];

  const choice = HAIL_MARY[variant] ?? HAIL_MARY[DEFAULT_HAIL_MARY_VARIANT];
  const count = choice.wordings.length;
  const index = ((Math.trunc(pick) % count) + count) % count;
  const wording = choice.wordings[index];

  return { id, title: wording.title, text: wording.text };
}
