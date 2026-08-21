import { describe, expect, it } from 'vitest';
import {
  decodeEntities,
  gospelFromAelf,
  gospelFromBibleApi,
  textFromHtml,
  toEnglishReference,
} from '@/lib/rosary/gospel';

// Exactly what AELF returned for 21 August 2026, trimmed to the shape used.
const AELF_SAMPLE = {
  informations: {
    ligne1: 'vendredi, 20ème Semaine du Temps Ordinaire',
    ligne2: 'S.Pie X, pape',
  },
  messes: [
    {
      lectures: [
        { type: 'lecture_1', ref: 'Ez 37, 1-14', contenu: '<p>Ossements.</p>' },
        { type: 'psaume', ref: 'Ps 106 (107), 2-3', contenu: '<p>Rendez grâce.</p>' },
        {
          type: 'evangile',
          ref: 'Mt 22, 34-40',
          titre: '« Tu aimeras le Seigneur ton Dieu de tout ton cœur »',
          intro_lue: 'Évangile de Jésus Christ selon saint Matthieu',
          contenu:
            '<p>    En ce temps-là,<br />\n    Les pharisiens,<br />\nse réunirent,</p>\n\n<p>            – Acclamons la Parole de Dieu.</p>',
        },
      ],
    },
  ],
};

describe('reading the passage out of AELF', () => {
  it('picks the gospel, not the first reading or the psalm', () => {
    const gospel = gospelFromAelf(AELF_SAMPLE, '2026-08-21')!;
    expect(gospel.reference).toBe('Mt 22, 34-40');
    expect(gospel.paragraphs.join(' ')).toContain('pharisiens');
    expect(gospel.paragraphs.join(' ')).not.toContain('Ossements');
  });

  it('keeps the title, the introduction and what the day celebrates', () => {
    const gospel = gospelFromAelf(AELF_SAMPLE, '2026-08-21')!;
    expect(gospel.intro).toContain('saint Matthieu');
    expect(gospel.title).toContain('Tu aimeras');
    expect(gospel.feast).toBe('S.Pie X, pape');
    expect(gospel.credit).toBe('AELF');
  });

  it('returns nothing rather than something empty when there is no gospel', () => {
    expect(gospelFromAelf({ messes: [{ lectures: [] }] }, '2026-08-21')).toBeNull();
    expect(gospelFromAelf({}, '2026-08-21')).toBeNull();
    expect(
      gospelFromAelf({ messes: [{ lectures: [{ type: 'evangile', ref: 'Mt 1, 1' }] }] }, 'x'),
    ).toBeNull();
  });
});

describe('turning the lectionary HTML into text', () => {
  it('keeps the line breaks, because that is how it is read aloud', () => {
    const [first] = textFromHtml(AELF_SAMPLE.messes[0].lectures[2].contenu);
    expect(first.split('\n')).toEqual(['En ce temps-là,', 'Les pharisiens,', 'se réunirent,']);
  });

  it('splits paragraphs and drops the markup entirely', () => {
    const blocks = textFromHtml('<p>Un <em>deux</em> trois</p><p><strong>Quatre</strong></p>');
    expect(blocks).toEqual(['Un deux trois', 'Quatre']);
  });

  it('leaves no empty blocks behind', () => {
    expect(textFromHtml('<p></p><p>   </p><p>Réel</p>')).toEqual(['Réel']);
    expect(textFromHtml('')).toEqual([]);
  });

  it('decodes the entities the feed actually uses', () => {
    expect(decodeEntities('&laquo;&nbsp;Ma&icirc;tre&nbsp;&raquo;')).toContain('«');
    expect(decodeEntities('c&#8217;est')).toBe('c’est');
    expect(decodeEntities('&#x2019;')).toBe('’');
    expect(decodeEntities('&amp;')).toBe('&');
  });
});

describe('addressing the English text', () => {
  it('translates the four gospels', () => {
    expect(toEnglishReference('Mt 22, 34-40')).toBe('Matthew 22:34-40');
    expect(toEnglishReference('Mc 7, 14-23')).toBe('Mark 7:14-23');
    expect(toEnglishReference('Lc 1, 26-38')).toBe('Luke 1:26-38');
    expect(toEnglishReference('Jn 6, 51-58')).toBe('John 6:51-58');
  });

  it('joins the split ranges the lectionary uses', () => {
    expect(toEnglishReference('Mc 7, 1-8.14-15.21-23')).toBe('Mark 7:1-8,14-15,21-23');
  });

  it('drops the half-verse letters, which no plain reference carries', () => {
    expect(toEnglishReference('Lc 9, 28b-36')).toBe('Luke 9:28-36');
  });

  it('refuses anything that is not one of the four', () => {
    expect(toEnglishReference('Ez 37, 1-14')).toBeNull();
    expect(toEnglishReference('Ps 106 (107), 2-3')).toBeNull();
    expect(toEnglishReference('nonsense')).toBeNull();
    expect(toEnglishReference('')).toBeNull();
  });
});

describe('the English passage', () => {
  const french = gospelFromAelf(AELF_SAMPLE, '2026-08-21')!;

  it('joins the verses and credits the translation', () => {
    const english = gospelFromBibleApi(
      {
        reference: 'Matthew 22:34-40',
        verses: [{ text: 'But the Pharisees,\nwhen they heard\n' }, { text: 'asked him.\n' }],
      },
      french,
    )!;
    expect(english.reference).toBe('Matthew 22:34-40');
    expect(english.paragraphs).toEqual(['But the Pharisees, when they heard asked him.']);
    expect(english.credit).toBe('World English Bible');
    expect(english.date).toBe('2026-08-21');
  });

  it('drops the French heading and feast rather than showing them in English', () => {
    const english = gospelFromBibleApi({ verses: [{ text: 'A verse.' }] }, french)!;
    expect(english.intro).toBeNull();
    expect(english.title).toBeNull();
    expect(english.feast).toBeNull();
  });

  it('gives up when the passage comes back empty', () => {
    expect(gospelFromBibleApi({ verses: [] }, french)).toBeNull();
    expect(gospelFromBibleApi({}, french)).toBeNull();
  });
});
