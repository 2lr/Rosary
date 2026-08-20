import type { Lang } from '@/lib/i18n/config';

export type MysterySetId = 'joyful' | 'luminous' | 'sorrowful' | 'glorious';

export type Mystery = {
  index: number;
  title: Record<Lang, string>;
  /** Scripture the meditation rests on. */
  scripture: Record<Lang, string>;
  /** A short passage to hold in mind while the decade is prayed. */
  meditation: Record<Lang, string>;
  /** The grace traditionally asked for with this mystery. */
  fruit: Record<Lang, string>;
};

export type MysterySet = {
  id: MysterySetId;
  name: Record<Lang, string>;
  /** Days of the week this set is prayed on. 0 = Sunday. */
  days: number[];
  /** Accent hue (deg) used by the generative artwork. */
  hue: number;
  mysteries: Mystery[];
};

export const MYSTERY_SETS: Record<MysterySetId, MysterySet> = {
  joyful: {
    id: 'joyful',
    name: { fr: 'Mystères joyeux', en: 'Joyful Mysteries' },
    days: [1, 6], // Monday, Saturday
    hue: 42,
    mysteries: [
      {
        index: 1,
        title: { fr: 'L’Annonciation', en: 'The Annunciation' },
        scripture: { fr: 'Luc 1, 26-38', en: 'Luke 1:26–38' },
        meditation: {
          fr: 'L’ange Gabriel est envoyé à Marie. Elle est troublée, elle interroge, puis elle consent : « Voici la servante du Seigneur ; que tout m’advienne selon ta parole. » Dieu attend un oui libre pour entrer dans le monde.',
          en: 'The angel Gabriel is sent to Mary. She is troubled, she questions, and then she consents: “Behold the handmaid of the Lord; be it done unto me according to thy word.” God waits on a free yes to enter the world.',
        },
        fruit: { fr: 'L’humilité', en: 'Humility' },
      },
      {
        index: 2,
        title: { fr: 'La Visitation', en: 'The Visitation' },
        scripture: { fr: 'Luc 1, 39-56', en: 'Luke 1:39–56' },
        meditation: {
          fr: 'Marie part en hâte vers la montagne pour servir Élisabeth. À sa salutation, l’enfant tressaille de joie. Celui qui porte le Christ ne le garde pas pour lui.',
          en: 'Mary sets out in haste to the hill country to serve Elizabeth. At her greeting the child leaps for joy. Whoever carries Christ does not keep him.',
        },
        fruit: { fr: 'La charité fraternelle', en: 'Love of neighbour' },
      },
      {
        index: 3,
        title: { fr: 'La Nativité', en: 'The Nativity' },
        scripture: { fr: 'Luc 2, 1-20', en: 'Luke 2:1–20' },
        meditation: {
          fr: 'Il n’y avait pas de place pour eux dans la salle commune. Dieu se fait petit, pauvre, dépendant, couché dans une mangeoire — et ce sont des bergers qui l’apprennent les premiers.',
          en: 'There was no room for them in the inn. God makes himself small, poor and dependent, laid in a manger — and it is shepherds who hear of it first.',
        },
        fruit: { fr: 'La pauvreté de cœur', en: 'Poverty of spirit' },
      },
      {
        index: 4,
        title: { fr: 'La Présentation de Jésus au Temple', en: 'The Presentation in the Temple' },
        scripture: { fr: 'Luc 2, 22-39', en: 'Luke 2:22–39' },
        meditation: {
          fr: 'Marie et Joseph offrent l’enfant selon la Loi. Syméon le reçoit comme lumière des nations, et annonce à Marie qu’un glaive lui transpercera l’âme. L’offrande vraie a un prix.',
          en: 'Mary and Joseph offer the child according to the Law. Simeon receives him as a light to the nations, and tells Mary that a sword will pierce her soul. A true offering has a cost.',
        },
        fruit: { fr: 'L’obéissance', en: 'Obedience' },
      },
      {
        index: 5,
        title: { fr: 'Le Recouvrement de Jésus au Temple', en: 'The Finding in the Temple' },
        scripture: { fr: 'Luc 2, 41-52', en: 'Luke 2:41–52' },
        meditation: {
          fr: 'Trois jours de recherche angoissée, puis l’enfant retrouvé parmi les docteurs : « Ne saviez-vous pas qu’il me faut être chez mon Père ? » Marie ne comprend pas, et garde tout dans son cœur.',
          en: 'Three days of anxious searching, then the child found among the teachers: “Did you not know that I must be about my Father’s business?” Mary does not understand, and keeps all these things in her heart.',
        },
        fruit: { fr: 'Chercher Dieu en toutes choses', en: 'Seeking God in all things' },
      },
    ],
  },

  luminous: {
    id: 'luminous',
    name: { fr: 'Mystères lumineux', en: 'Luminous Mysteries' },
    days: [4], // Thursday
    hue: 200,
    mysteries: [
      {
        index: 1,
        title: { fr: 'Le Baptême de Jésus dans le Jourdain', en: 'The Baptism of Jesus in the Jordan' },
        scripture: { fr: 'Matthieu 3, 13-17', en: 'Matthew 3:13–17' },
        meditation: {
          fr: 'Jésus descend dans l’eau avec les pécheurs. Les cieux s’ouvrent, l’Esprit repose sur lui, et la voix dit : « Celui-ci est mon Fils bien-aimé. » Notre baptême nous plonge dans cette même parole.',
          en: 'Jesus goes down into the water with sinners. The heavens open, the Spirit rests on him, and the voice says: “This is my beloved Son.” Our own baptism plunges us into that same word.',
        },
        fruit: { fr: 'La fidélité à notre baptême', en: 'Openness to the Holy Spirit' },
      },
      {
        index: 2,
        title: { fr: 'Les Noces de Cana', en: 'The Wedding at Cana' },
        scripture: { fr: 'Jean 2, 1-12', en: 'John 2:1–12' },
        meditation: {
          fr: '« Ils n’ont plus de vin. » Marie remarque le manque avant tout le monde et ne dit qu’une chose aux serviteurs : « Faites tout ce qu’il vous dira. » Le premier signe naît d’une intercession discrète.',
          en: '“They have no wine.” Mary notices the lack before anyone else, and says only one thing to the servants: “Do whatever he tells you.” The first sign is born of a quiet intercession.',
        },
        fruit: { fr: 'La confiance en Marie', en: 'To Jesus through Mary' },
      },
      {
        index: 3,
        title: { fr: 'L’Annonce du Royaume et l’appel à la conversion', en: 'The Proclamation of the Kingdom' },
        scripture: { fr: 'Marc 1, 14-15', en: 'Mark 1:14–15' },
        meditation: {
          fr: '« Le temps est accompli : le Royaume de Dieu est tout proche. Convertissez-vous et croyez à l’Évangile. » Le Royaume n’est pas une idée lointaine mais une porte ouverte aujourd’hui.',
          en: '“The time is fulfilled, and the kingdom of God is at hand: repent, and believe the gospel.” The Kingdom is not a distant idea but a door standing open today.',
        },
        fruit: { fr: 'La conversion du cœur', en: 'Repentance and trust in God' },
      },
      {
        index: 4,
        title: { fr: 'La Transfiguration', en: 'The Transfiguration' },
        scripture: { fr: 'Luc 9, 28-36', en: 'Luke 9:28–36' },
        meditation: {
          fr: 'Sur la montagne, son visage devient autre et ses vêtements d’une blancheur éclatante. « Celui-ci est mon Fils, celui que j’ai choisi : écoutez-le. » Une lumière donnée pour tenir dans la nuit qui vient.',
          en: 'On the mountain his face is altered and his clothing dazzling white. “This is my Son, my Chosen; listen to him.” A light given so that they might hold on through the night to come.',
        },
        fruit: { fr: 'Le désir de la sainteté', en: 'Desire for holiness' },
      },
      {
        index: 5,
        title: { fr: 'L’Institution de l’Eucharistie', en: 'The Institution of the Eucharist' },
        scripture: { fr: 'Matthieu 26, 26-29', en: 'Matthew 26:26–29' },
        meditation: {
          fr: 'La veille de sa passion, il prend le pain, rend grâce, le rompt : « Ceci est mon corps, livré pour vous. » Il se donne avant qu’on ne le prenne.',
          en: 'On the night before his passion he takes bread, gives thanks, breaks it: “This is my body, given for you.” He gives himself before he is taken.',
        },
        fruit: { fr: 'L’adoration', en: 'Adoration' },
      },
    ],
  },

  sorrowful: {
    id: 'sorrowful',
    name: { fr: 'Mystères douloureux', en: 'Sorrowful Mysteries' },
    days: [2, 5], // Tuesday, Friday
    hue: 348,
    mysteries: [
      {
        index: 1,
        title: { fr: 'L’Agonie de Jésus au jardin des Oliviers', en: 'The Agony in the Garden' },
        scripture: { fr: 'Luc 22, 39-46', en: 'Luke 22:39–46' },
        meditation: {
          fr: 'Sa sueur devient comme des gouttes de sang. « Père, si tu le veux, éloigne de moi cette coupe ; cependant, que ce ne soit pas ma volonté, mais la tienne. » La prière ne supprime pas l’angoisse : elle la traverse.',
          en: 'His sweat becomes like drops of blood. “Father, if thou be willing, remove this cup from me: nevertheless not my will, but thine, be done.” Prayer does not remove the anguish; it carries him through it.',
        },
        fruit: { fr: 'La contrition', en: 'Sorrow for sin' },
      },
      {
        index: 2,
        title: { fr: 'La Flagellation', en: 'The Scourging at the Pillar' },
        scripture: { fr: 'Jean 19, 1', en: 'John 19:1' },
        meditation: {
          fr: 'Pilate le fit flageller. Un seul verset pour ce que le corps endure. Le silence du récit est celui de la victime, non celui de l’indifférence.',
          en: 'Pilate took Jesus and scourged him. One verse for all that the body endures. The silence of the account is the victim’s, not indifference.',
        },
        fruit: { fr: 'La pureté', en: 'Purity' },
      },
      {
        index: 3,
        title: { fr: 'Le Couronnement d’épines', en: 'The Crowning with Thorns' },
        scripture: { fr: 'Matthieu 27, 27-31', en: 'Matthew 27:27–31' },
        meditation: {
          fr: 'On lui met un roseau dans la main et l’on plie le genou pour se moquer : « Salut, roi des Juifs ! » La royauté vraie se laisse tourner en dérision sans cesser d’aimer.',
          en: 'They put a reed in his hand and bow the knee in mockery: “Hail, King of the Jews!” True kingship lets itself be ridiculed without ceasing to love.',
        },
        fruit: { fr: 'Le courage', en: 'Moral courage' },
      },
      {
        index: 4,
        title: { fr: 'Le Portement de la Croix', en: 'The Carrying of the Cross' },
        scripture: { fr: 'Luc 23, 26-32', en: 'Luke 23:26–32' },
        meditation: {
          fr: 'Simon de Cyrène est réquisitionné pour porter la croix derrière Jésus. Ce qui commence comme une contrainte devient la place la plus proche du Christ.',
          en: 'Simon of Cyrene is seized and made to carry the cross behind Jesus. What begins as an imposition becomes the closest place to Christ.',
        },
        fruit: { fr: 'La patience', en: 'Patience' },
      },
      {
        index: 5,
        title: { fr: 'La Crucifixion et la mort de Jésus', en: 'The Crucifixion and Death of Our Lord' },
        scripture: { fr: 'Jean 19, 25-30', en: 'John 19:25–30' },
        meditation: {
          fr: 'Près de la croix se tenait sa mère. « Femme, voici ton fils. » Puis : « Tout est accompli. » Il donne tout, jusqu’à sa mère, avant de remettre l’esprit.',
          en: 'Standing by the cross was his mother. “Woman, behold thy son.” Then: “It is finished.” He gives everything away, even his mother, before giving up his spirit.',
        },
        fruit: { fr: 'La persévérance', en: 'Perseverance' },
      },
    ],
  },

  glorious: {
    id: 'glorious',
    name: { fr: 'Mystères glorieux', en: 'Glorious Mysteries' },
    days: [0, 3], // Sunday, Wednesday
    hue: 268,
    mysteries: [
      {
        index: 1,
        title: { fr: 'La Résurrection', en: 'The Resurrection' },
        scripture: { fr: 'Jean 20, 1-18', en: 'John 20:1–18' },
        meditation: {
          fr: 'Le premier jour de la semaine, très tôt, alors qu’il faisait encore sombre. Marie-Madeleine ne le reconnaît qu’à un mot : son nom. La résurrection se dit d’abord au singulier.',
          en: 'On the first day of the week, early, while it was still dark. Mary Magdalene recognises him only at one word: her name. The resurrection is spoken first in the singular.',
        },
        fruit: { fr: 'La foi', en: 'Faith' },
      },
      {
        index: 2,
        title: { fr: 'L’Ascension', en: 'The Ascension' },
        scripture: { fr: 'Actes 1, 6-11', en: 'Acts 1:6–11' },
        meditation: {
          fr: 'Il est élevé sous leurs yeux, et une nuée le dérobe. « Pourquoi restez-vous à regarder vers le ciel ? » L’absence visible devient mission.',
          en: 'He is lifted up before their eyes and a cloud takes him from their sight. “Why stand ye gazing up into heaven?” Visible absence becomes mission.',
        },
        fruit: { fr: 'L’espérance', en: 'Hope' },
      },
      {
        index: 3,
        title: { fr: 'La Pentecôte', en: 'The Descent of the Holy Spirit' },
        scripture: { fr: 'Actes 2, 1-13', en: 'Acts 2:1–13' },
        meditation: {
          fr: 'Ils étaient tous ensemble au même endroit, et Marie avec eux. Un souffle violent, des langues de feu, et des hommes apeurés se mettent à parler toutes les langues du monde.',
          en: 'They were all together in one place, and Mary with them. A rushing wind, tongues of fire, and frightened men begin to speak in every language under heaven.',
        },
        fruit: { fr: 'Les dons de l’Esprit Saint', en: 'Gifts of the Holy Spirit' },
      },
      {
        index: 4,
        title: { fr: 'L’Assomption de la Vierge Marie', en: 'The Assumption of the Blessed Virgin Mary' },
        scripture: { fr: 'Apocalypse 12, 1', en: 'Revelation 12:1' },
        meditation: {
          fr: 'Un signe grandiose apparut au ciel : une femme, vêtue de soleil. Celle qui a porté la Vie n’est pas laissée à la corruption : elle est accueillie tout entière.',
          en: 'A great sign appeared in heaven: a woman clothed with the sun. She who bore Life is not left to corruption; she is received whole.',
        },
        fruit: { fr: 'La grâce d’une bonne mort', en: 'Grace of a happy death' },
      },
      {
        index: 5,
        title: { fr: 'Le Couronnement de Marie au Ciel', en: 'The Coronation of Mary' },
        scripture: { fr: 'Apocalypse 12, 1', en: 'Revelation 12:1' },
        meditation: {
          fr: 'Une couronne de douze étoiles. La servante devient reine, non par conquête mais parce qu’elle a dit oui jusqu’au bout. Ce qui lui est promis nous est promis.',
          en: 'A crown of twelve stars. The handmaid becomes queen, not by conquest but because she said yes to the end. What is promised to her is promised to us.',
        },
        fruit: { fr: 'La confiance en Marie', en: 'Trust in Mary’s intercession' },
      },
    ],
  },
};

export const MYSTERY_SET_ORDER: MysterySetId[] = ['joyful', 'luminous', 'sorrowful', 'glorious'];

/**
 * The set of mysteries assigned to a given day of the week by the customary
 * cycle confirmed in Rosarium Virginis Mariae (2002):
 * Monday & Saturday — joyful; Tuesday & Friday — sorrowful;
 * Wednesday & Sunday — glorious; Thursday — luminous.
 */
export function mysterySetForDate(date: Date): MysterySetId {
  const day = date.getDay();
  const found = MYSTERY_SET_ORDER.find((id) => MYSTERY_SETS[id].days.includes(day));
  return found ?? 'glorious';
}

export function isMysterySetId(value: unknown): value is MysterySetId {
  return typeof value === 'string' && value in MYSTERY_SETS;
}
