import type { Lang } from '@/lib/i18n/config';
import { PRAYERS } from '@/lib/rosary/prayers';

/**
 * What is actually said on each of the nine days — all of it.
 *
 * A novena is not nine rosaries; it is one prayer, said nine days running,
 * usually with a rosary alongside it. Without the words there is nothing to
 * pray, so each of them carries its own, from the sign of the cross to the last
 * invocation. Nothing here is named and left for the reader to find: the Our
 * Father, the Hail Mary and the Glory Be that close a novena are written out
 * where they are said, because a prayer you have to go and look up is a prayer
 * you do not say.
 *
 * These are written in the traditional form each novena takes — the address,
 * what is remembered, what is asked — rather than copied from any one published
 * booklet. The Divine Mercy novena is the exception in shape: Christ asked St
 * Faustina to bring him a different company of souls on each of the nine days,
 * so that one has a proper intention per day as well.
 */

export type NovenaPrayer = {
  /** How the day opens, proper to this novena. */
  opening: Record<Lang, string[]>;
  /** The prayer itself, said on every one of the nine days. */
  daily: Record<Lang, string[]>;
  /** A proper intention for each day, when the novena has them. Nine entries. */
  eachDay?: Record<Lang, string[]>;
  /** The last words, proper to this novena, after the common prayers. */
  closing: Record<Lang, string[]>;
};

export const NOVENA_PRAYERS: Record<string, NovenaPrayer> = {
  lourdes: {
    opening: {
      fr: [
        'Seigneur, vous avez voulu que votre Mère se montre à une enfant pauvre, dans le creux d’un rocher. Ouvrez-moi ces neuf jours à ce que vous voudrez y faire.',
      ],
      en: [
        'Lord, you willed that your Mother should show herself to a poor child in the hollow of a rock. Open these nine days in me to whatever you mean to do in them.',
      ],
    },
    daily: {
      fr: [
        'Ô Marie, conçue sans péché, qui avez daigné apparaître à Bernadette dans le creux du rocher de Massabielle, et qui vous êtes nommée l’Immaculée Conception :',
        'obtenez-nous la santé du corps si Dieu la juge bonne pour nous, et toujours celle de l’âme. Apprenez-nous à porter la maladie et la peine comme vous avez porté la vôtre, et à ne jamais désespérer de la bonté de votre Fils. Amen.',
      ],
      en: [
        'O Mary, conceived without sin, who stooped to appear to Bernadette in the hollow of the rock at Massabielle, and who named yourself the Immaculate Conception:',
        'obtain for us health of body if God judges it good for us, and always health of soul. Teach us to carry sickness and sorrow as you carried yours, and never to despair of your Son’s goodness. Amen.',
      ],
    },
    closing: {
      fr: ['Notre-Dame de Lourdes, priez pour nous.', 'Sainte Bernadette, priez pour nous.'],
      en: ['Our Lady of Lourdes, pray for us.', 'Saint Bernadette, pray for us.'],
    },
  },

  joseph: {
    opening: {
      fr: [
        'Dieu notre Père, vous avez confié ce que vous aviez de plus précieux à un homme juste et silencieux. Donnez-moi de le prier ces neuf jours avec confiance.',
      ],
      en: [
        'God our Father, you entrusted what was most precious to you to a just and silent man. Give me to pray to him these nine days with confidence.',
      ],
    },
    daily: {
      fr: [
        'Ô glorieux saint Joseph, époux de Marie et père nourricier de Jésus, vous à qui Dieu a confié ce qu’il avait de plus précieux :',
        'prenez soin de ce que je vous confie à mon tour. Obtenez-moi le travail dont j’ai besoin et la droiture pour l’accomplir, la paix dans ma maison, et la grâce de me taire quand il le faut. Vous qui êtes mort entre Jésus et Marie, obtenez-moi la même compagnie à ma dernière heure. Amen.',
      ],
      en: [
        'O glorious Saint Joseph, husband of Mary and foster father of Jesus, to whom God entrusted what was most precious to him:',
        'take care of what I entrust to you in turn. Obtain for me the work I need and the honesty to do it, peace in my house, and the grace to keep silent when I should. You who died between Jesus and Mary, obtain me the same company at my last hour. Amen.',
      ],
    },
    closing: {
      fr: ['Saint Joseph, patron de l’Église universelle, priez pour nous.'],
      en: ['Saint Joseph, patron of the universal Church, pray for us.'],
    },
  },

  annunciation: {
    opening: {
      fr: [
        'Esprit Saint, vous qui avez couvert Marie de votre ombre, venez sur ces neuf jours et sur ce que j’ai à décider.',
      ],
      en: [
        'Holy Spirit, you who overshadowed Mary, come upon these nine days and upon what I have to decide.',
      ],
    },
    daily: {
      fr: [
        'Vierge de l’Annonciation, à qui l’ange demanda l’impossible et qui avez répondu : « Qu’il me soit fait selon ta parole » :',
        'obtenez-moi de reconnaître ce que Dieu me demande, et le courage de dire oui avant de tout comprendre. Que ma vie, comme la vôtre, soit disponible. Amen.',
      ],
      en: [
        'Virgin of the Annunciation, of whom the angel asked the impossible, and who answered: “Let it be done to me according to your word”:',
        'obtain for me the sight to recognise what God is asking, and the courage to say yes before I understand it all. Let my life, like yours, be available. Amen.',
      ],
    },
    closing: {
      fr: ['Sainte Marie, servante du Seigneur, priez pour nous.'],
      en: ['Holy Mary, handmaid of the Lord, pray for us.'],
    },
  },

  mercy: {
    opening: {
      fr: [
        'Jésus, j’ai confiance en vous. Je viens vous amener aujourd’hui ceux que vous m’avez demandés, et les plonger dans votre miséricorde.',
      ],
      en: [
        'Jesus, I trust in you. I come today to bring you those you asked me for, and to immerse them in your mercy.',
      ],
    },
    daily: {
      fr: [
        'Ô Sang et Eau qui avez jailli du Cœur de Jésus comme source de miséricorde pour nous, j’ai confiance en vous.',
        'Père éternel, je vous offre le Corps et le Sang, l’âme et la divinité de votre Fils bien-aimé, en réparation de nos péchés et de ceux du monde entier ; pour sa douloureuse Passion, prenez pitié de nous et du monde entier. Amen.',
      ],
      en: [
        'O Blood and Water, which gushed forth from the Heart of Jesus as a fount of mercy for us, I trust in you.',
        'Eternal Father, I offer you the Body and Blood, Soul and Divinity of your dearly beloved Son, in atonement for our sins and those of the whole world; for the sake of his sorrowful Passion, have mercy on us and on the whole world. Amen.',
      ],
    },
    eachDay: {
      fr: [
        'Aujourd’hui, amenez-moi toute l’humanité, et particulièrement les pécheurs.',
        'Aujourd’hui, amenez-moi les âmes des prêtres et des religieux.',
        'Aujourd’hui, amenez-moi les âmes fidèles et pieuses.',
        'Aujourd’hui, amenez-moi ceux qui ne croient pas en Dieu et ceux qui ne connaissent pas encore le Christ.',
        'Aujourd’hui, amenez-moi les âmes séparées de l’Église.',
        'Aujourd’hui, amenez-moi les âmes douces et humbles, et celles des enfants.',
        'Aujourd’hui, amenez-moi les âmes qui vénèrent et glorifient la miséricorde.',
        'Aujourd’hui, amenez-moi les âmes retenues au purgatoire.',
        'Aujourd’hui, amenez-moi les âmes tièdes.',
      ],
      en: [
        'Today, bring me all mankind, and especially sinners.',
        'Today, bring me the souls of priests and religious.',
        'Today, bring me the devout and faithful souls.',
        'Today, bring me those who do not believe in God, and those who do not yet know Christ.',
        'Today, bring me the souls who have separated themselves from the Church.',
        'Today, bring me the meek and humble souls, and the souls of children.',
        'Today, bring me the souls who venerate and glorify mercy.',
        'Today, bring me the souls detained in purgatory.',
        'Today, bring me the lukewarm souls.',
      ],
    },
    closing: {
      fr: [
        'Éternel Père, tournez votre regard miséricordieux vers ces âmes, et faites-leur la grâce que je vous demande.',
        'Jésus, j’ai confiance en vous.',
      ],
      en: [
        'Eternal Father, turn your merciful gaze upon these souls, and grant them the grace I ask of you.',
        'Jesus, I trust in you.',
      ],
    },
  },

  fatima: {
    opening: {
      fr: [
        'Très Sainte Trinité, Père, Fils et Saint-Esprit, je vous adore profondément, et je vous offre ces neuf jours pour la paix du monde.',
      ],
      en: [
        'Most Holy Trinity, Father, Son and Holy Spirit, I adore you profoundly, and I offer you these nine days for the peace of the world.',
      ],
    },
    daily: {
      fr: [
        'Notre-Dame de Fatima, vous êtes venue à trois enfants demander la prière, la pénitence et le rosaire, pour la paix du monde :',
        'obtenez-nous cette paix, dans les nations et d’abord dans nos maisons. Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l’enfer, conduisez au ciel toutes les âmes, et secourez surtout celles qui ont le plus besoin de votre miséricorde. Amen.',
      ],
      en: [
        'Our Lady of Fátima, you came to three children asking for prayer, for penance and for the rosary, for the peace of the world:',
        'obtain us that peace, among nations and first of all in our houses. O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, and help especially those most in need of your mercy. Amen.',
      ],
    },
    closing: {
      fr: [
        'Notre-Dame du Rosaire de Fatima, priez pour nous.',
        'Saints François et Jacinthe, priez pour nous.',
      ],
      en: [
        'Our Lady of the Rosary of Fátima, pray for us.',
        'Saints Francisco and Jacinta, pray for us.',
      ],
    },
  },

  spirit: {
    opening: {
      fr: [
        'Nous voici comme les apôtres au Cénacle, avec Marie, à attendre ce qui a été promis. Seigneur, tenez-nous là ces neuf jours.',
      ],
      en: [
        'Here we are like the apostles in the upper room, with Mary, waiting for what was promised. Lord, keep us there these nine days.',
      ],
    },
    daily: {
      fr: [
        'Viens, Esprit Saint, remplis le cœur de tes fidèles et allume en eux le feu de ton amour. Envoie ton Esprit et tout sera créé, et tu renouvelleras la face de la terre.',
        'Toi qui as rassemblé les apôtres et Marie dans l’attente, tiens-nous éveillés ces neuf jours. Donne-nous ce que nous n’avons pas : la sagesse et l’intelligence, le conseil et la force, la science, la piété, et la crainte qui est le commencement de l’amour. Amen.',
      ],
      en: [
        'Come, Holy Spirit, fill the hearts of your faithful and kindle in them the fire of your love. Send forth your Spirit and they shall be created, and you shall renew the face of the earth.',
        'You who gathered the apostles and Mary into waiting, keep us awake these nine days. Give us what we do not have: wisdom and understanding, counsel and might, knowledge, piety, and the fear that is the beginning of love. Amen.',
      ],
    },
    closing: {
      fr: ['Esprit Saint, Esprit de vérité, venez dans nos cœurs.'],
      en: ['Holy Spirit, Spirit of truth, come into our hearts.'],
    },
  },

  'sacred-heart': {
    opening: {
      fr: [
        'Seigneur Jésus, doux et humble de cœur, rendez mon cœur semblable au vôtre.',
      ],
      en: [
        'Lord Jesus, meek and humble of heart, make my heart like unto yours.',
      ],
    },
    daily: {
      fr: [
        'Ô Cœur de Jésus, ouvert sur la croix et qui n’avez rien gardé pour vous :',
        'apprenez-moi à aimer sans compter et à pardonner sans revenir dessus. Vous avez dit : « Venez à moi, vous tous qui peinez, et je vous soulagerai. » Je viens, et je vous confie ce que je porte. Doux Cœur de Jésus, faites que je vous aime toujours davantage. Amen.',
      ],
      en: [
        'O Heart of Jesus, opened on the cross, which kept nothing back:',
        'teach me to love without counting the cost and to forgive without taking it up again. You said: “Come to me, all you who labour, and I will give you rest.” I come, and I entrust to you what I am carrying. Sweet Heart of Jesus, let me love you more and more. Amen.',
      ],
    },
    closing: {
      fr: ['Sacré-Cœur de Jésus, j’ai confiance en vous.'],
      en: ['Sacred Heart of Jesus, I place my trust in you.'],
    },
  },

  carmel: {
    opening: {
      fr: [
        'Souvenez-vous, ô très pure Vierge du Carmel, qu’on n’a jamais entendu dire qu’aucun de vos enfants ait été laissé sans secours.',
      ],
      en: [
        'Remember, O most pure Virgin of Carmel, that it has never been heard that any of your children was left without help.',
      ],
    },
    daily: {
      fr: [
        'Ô très belle fleur du Carmel, vigne chargée de fruits, splendeur du ciel, Mère bénie du Fils de Dieu :',
        'vous qui donnez à vos enfants le signe de votre protection, couvrez-nous de ce même manteau. Obtenez-nous la fidélité dans les jours ordinaires, et de persévérer là où nous sommes. Amen.',
      ],
      en: [
        'O most beautiful flower of Carmel, vine laden with fruit, splendour of heaven, blessed Mother of the Son of God:',
        'you who give your children the sign of your protection, cover us with that same mantle. Obtain us faithfulness in ordinary days, and perseverance where we are. Amen.',
      ],
    },
    closing: {
      fr: ['Notre-Dame du Mont-Carmel, ornement et gloire du Carmel, priez pour nous.'],
      en: ['Our Lady of Mount Carmel, beauty and glory of Carmel, pray for us.'],
    },
  },

  assumption: {
    opening: {
      fr: [
        'Dieu éternel, vous avez pris auprès de vous, corps et âme, la mère de votre Fils. Tournez ces neuf jours vers ce que vous nous promettez.',
      ],
      en: [
        'Eternal God, you took to yourself, body and soul, the mother of your Son. Turn these nine days towards what you promise us.',
      ],
    },
    daily: {
      fr: [
        'Vierge élevée au ciel en son corps et en son âme, première de tous les rachetés à recevoir ce que nous attendons :',
        'obtenez-nous de vivre déjà tournés vers là où vous êtes. Que la mort ne nous fasse plus peur, puisqu’elle vous a été un passage. Amen.',
      ],
      en: [
        'Virgin taken up to heaven in body and soul, first of all the redeemed to receive what we are waiting for:',
        'obtain us to live already turned towards where you are. Let death frighten us no longer, since for you it was a passage. Amen.',
      ],
    },
    closing: {
      fr: ['Marie, élevée au ciel, priez pour nous.'],
      en: ['Mary, taken up into heaven, pray for us.'],
    },
  },

  queenship: {
    opening: {
      fr: [
        'Reine du ciel, réjouissez-vous, alléluia — car celui que vous avez porté est ressuscité, alléluia.',
      ],
      en: [
        'Queen of heaven, rejoice, alleluia — for he whom you were worthy to bear is risen, alleluia.',
      ],
    },
    daily: {
      fr: [
        'Sainte Marie, Reine du ciel et de la terre, couronnée par votre Fils et restée notre mère :',
        'régnez sur ce qui en moi ne se laisse pas gouverner. Vous à qui tout pouvoir a été donné par grâce, obtenez-moi la seule chose qui compte : faire la volonté de Dieu aujourd’hui. Amen.',
      ],
      en: [
        'Holy Mary, Queen of heaven and earth, crowned by your Son and still our mother:',
        'reign over what in me will not be governed. You to whom all power was given by grace, obtain me the one thing that matters: to do God’s will today. Amen.',
      ],
    },
    closing: {
      fr: ['Sainte Marie, Reine et Mère, priez pour nous.'],
      en: ['Holy Mary, Queen and Mother, pray for us.'],
    },
  },

  sorrows: {
    opening: {
      fr: [
        'Debout, la Mère des douleurs se tenait près de la croix, en larmes, tandis que son Fils y était suspendu.',
      ],
      en: [
        'At the cross her station keeping, stood the mournful Mother weeping, close to Jesus to the last.',
      ],
    },
    daily: {
      fr: [
        'Notre-Dame des Douleurs, vous qui êtes restée debout près de la croix quand tous étaient partis :',
        'tenez-vous près de ceux qui souffrent aujourd’hui, et près de moi dans ce que je ne sais pas dire. Obtenez-moi de ne pas fuir la peine des autres. Amen.',
      ],
      en: [
        'Our Lady of Sorrows, you who stood by the cross when everyone else had gone:',
        'stand by those who suffer today, and by me in what I cannot put into words. Obtain me the grace not to flee from other people’s pain. Amen.',
      ],
    },
    closing: {
      fr: ['Notre-Dame des Douleurs, priez pour nous.'],
      en: ['Our Lady of Sorrows, pray for us.'],
    },
  },

  rosary: {
    opening: {
      fr: [
        'Marie, vous avez gardé toutes ces choses en les méditant dans votre cœur. Donnez-moi d’y entrer ces neuf jours.',
      ],
      en: [
        'Mary, you kept all these things, pondering them in your heart. Let me enter there these nine days.',
      ],
    },
    daily: {
      fr: [
        'Notre-Dame du Rosaire, vous qui avez enseigné cette prière simple et l’avez demandée si souvent :',
        'obtenez-moi de la dire fidèlement, sans la trouver longue ; d’y contempler avec vous la vie de votre Fils ; et d’en tirer, dizaine après dizaine, la patience que je n’ai pas. Amen.',
      ],
      en: [
        'Our Lady of the Rosary, who taught this simple prayer and asked for it so often:',
        'obtain me to say it faithfully, without finding it long; to contemplate with you the life of your Son; and to draw from it, decade by decade, the patience I do not have. Amen.',
      ],
    },
    closing: {
      fr: ['Notre-Dame du Rosaire, priez pour nous.'],
      en: ['Our Lady of the Rosary, pray for us.'],
    },
  },

  immaculate: {
    opening: {
      fr: ['Vous êtes toute belle, Marie, et la tache originelle n’est pas en vous.'],
      en: ['You are all fair, Mary, and the stain of original sin is not in you.'],
    },
    daily: {
      fr: [
        'Ô Marie conçue sans péché, priez pour nous qui avons recours à vous.',
        'Vous que Dieu a préservée dès le premier instant, obtenez-nous d’être lavés de ce qui nous alourdit, et de recommencer aussi souvent qu’il le faudra. Amen.',
      ],
      en: [
        'O Mary conceived without sin, pray for us who have recourse to you.',
        'You whom God preserved from the first instant, obtain us to be washed of what weighs us down, and to begin again as often as we must. Amen.',
      ],
    },
    closing: {
      fr: ['Ô Marie conçue sans péché, priez pour nous qui avons recours à vous.'],
      en: ['O Mary conceived without sin, pray for us who have recourse to you.'],
    },
  },

  christmas: {
    opening: {
      fr: ['Cieux, répandez d’en haut votre rosée, et que les nuées fassent pleuvoir le Juste.'],
      en: ['Drop down dew, ye heavens, from above, and let the clouds rain down the Just One.'],
    },
    daily: {
      fr: [
        'Ô Sagesse éternelle, sortie de la bouche du Très-Haut, venez nous enseigner le chemin.',
        'Nous vous attendons, Seigneur Jésus. Trouvez en nous, ces neuf jours, une place plus nette que l’étable, et venez-y quand même si nous n’avons rien préparé. Amen.',
      ],
      en: [
        'O eternal Wisdom, come forth from the mouth of the Most High, come and teach us the way.',
        'We are waiting for you, Lord Jesus. Find in us, these nine days, a place cleaner than the stable — and come anyway if we have prepared nothing. Amen.',
      ],
    },
    closing: {
      fr: ['Venez, Seigneur Jésus, ne tardez plus.'],
      en: ['Come, Lord Jesus, do not delay.'],
    },
  },
};

export function novenaPrayer(key: string): NovenaPrayer | null {
  return NOVENA_PRAYERS[key] ?? null;
}

/** One thing said, in the order it is said. */
export type NovenaStep = {
  id: string;
  title: string;
  lines: string[];
  /** Said more than once, when it is. */
  times?: number;
};

/**
 * The novenas built on the Marian pattern, which opens with three Hail Marys.
 *
 * The three are the shape of a Marian novena — they are what is actually said
 * before the prayer proper, and leaving them out was leaving out the part
 * anyone praying one would notice first. The novenas addressed to Christ, to
 * the Holy Spirit and to Saint Joseph do not carry them, so they do not get
 * them here either.
 */
const MARIAN = new Set([
  'lourdes',
  'annunciation',
  'fatima',
  'carmel',
  'assumption',
  'queenship',
  'sorrows',
  'rosary',
  'immaculate',
]);

/**
 * The whole of a day, in order, with nothing left to look up.
 *
 * The common prayers come from the same place as the rosary's, so they read
 * identically wherever they appear — including the French Notre Père in its
 * current form. What is said more than once carries how many times rather than
 * being printed again.
 */
export function novenaOrder(
  key: string,
  lang: Lang,
  /** 1 → 9. */
  day: number,
  labels: { opening: string; intention: string; prayer: string; closing: string },
): NovenaStep[] {
  const prayer = novenaPrayer(key);
  if (!prayer) return [];

  const common = (id: 'signOfTheCross' | 'ourFather' | 'hailMary' | 'gloryBe'): NovenaStep => ({
    id,
    title: PRAYERS[id].title[lang],
    lines: PRAYERS[id].text[lang],
  });

  const index = Math.min(9, Math.max(1, day)) - 1;
  const intention = prayer.eachDay?.[lang]?.[index] ?? null;

  return [
    common('signOfTheCross'),
    { id: 'opening', title: labels.opening, lines: prayer.opening[lang] },
    ...(MARIAN.has(key) ? [{ ...common('hailMary'), id: 'threeHailMarys', times: 3 }] : []),
    ...(intention ? [{ id: 'intention', title: labels.intention, lines: [intention] }] : []),
    { id: 'daily', title: labels.prayer, lines: prayer.daily[lang] },
    common('ourFather'),
    common('hailMary'),
    common('gloryBe'),
    { id: 'closing', title: labels.closing, lines: prayer.closing[lang] },
  ];
}

/**
 * What one day of a novena actually says, counted.
 *
 * Read off the same order the sheet renders, so the two can never drift: change
 * the shape of a novena and the count changes with it. A Marian day says four
 * Hail Marys — the three, and the one after the Our Father — where the others
 * say one.
 *
 * This is what a day of a novena is worth. Ten Hail Marys make a decade, and
 * that is how these come to count towards the rosary itself.
 */
export function novenaDayPrayers(key: string): {
  hailMarys: number;
  ourFathers: number;
  gloryBes: number;
} {
  const blank = { opening: '', intention: '', prayer: '', closing: '' };
  const totals = { hailMarys: 0, ourFathers: 0, gloryBes: 0 };

  for (const step of novenaOrder(key, 'fr', 1, blank)) {
    const times = step.times ?? 1;
    if (step.id === 'hailMary' || step.id === 'threeHailMarys') totals.hailMarys += times;
    else if (step.id === 'ourFather') totals.ourFathers += times;
    else if (step.id === 'gloryBe') totals.gloryBes += times;
  }

  return totals;
}
