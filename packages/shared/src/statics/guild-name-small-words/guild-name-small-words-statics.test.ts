import { guildNameSmallWordsStatics } from './guild-name-small-words-statics';

describe('guildNameSmallWordsStatics', () => {
  it('VALID: words => contains the locked 11 small words', () => {
    expect(guildNameSmallWordsStatics.words).toStrictEqual([
      'of',
      'the',
      'and',
      'a',
      'an',
      'in',
      'on',
      'for',
      'to',
      'at',
      'by',
    ]);
  });
});
