import type { Lang } from '@/lib/i18n/config';

/**
 * What is actually said on each of the nine days.
 *
 * A novena is not nine rosaries; it is one prayer, said nine days running,
 * usually with a rosary alongside it. Without the words there is nothing to
 * pray, so each of them carries its own.
 *
 * These are written here in the traditional form each novena takes — the
 * address, what is remembered, what is asked — rather than copied from any one
 * published booklet. The Divine Mercy novena is the exception in shape: Christ
 * asked St Faustina to bring him a different company of souls on each of the
 * nine days, so that one has a proper intention per day as well.
 *
 * Closing with the Our Father, the Hail Mary and the Glory Be is the common
 * practice and is named rather than written out: the app already has them.
 */

export type NovenaPrayer = {
  /** Said on every one of the nine days. */
  daily: Record<Lang, string[]>;
  /** A proper intention for each day, when the novena has them. Nine entries. */
  eachDay?: Record<Lang, string[]>;
};

export const NOVENA_PRAYERS: Record<string, NovenaPrayer> = {
  lourdes: {
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
  },

  joseph: {
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
  },

  annunciation: {
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
  },

  mercy: {
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
  },

  fatima: {
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
  },

  spirit: {
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
  },

  'sacred-heart': {
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
  },

  carmel: {
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
  },

  assumption: {
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
  },

  queenship: {
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
  },

  sorrows: {
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
  },

  rosary: {
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
  },

  immaculate: {
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
  },

  christmas: {
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
  },
};

export function novenaPrayer(key: string): NovenaPrayer | null {
  return NOVENA_PRAYERS[key] ?? null;
}
