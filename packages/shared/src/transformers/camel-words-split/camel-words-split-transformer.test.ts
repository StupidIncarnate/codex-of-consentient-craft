import { camelWordsSplitTransformer } from './camel-words-split-transformer';

describe('camelWordsSplitTransformer', () => {
  describe('valid input', () => {
    it('VALID: {text: parentQuestId} => returns parent, quest, id', () => {
      expect(camelWordsSplitTransformer({ text: 'parentQuestId' })).toStrictEqual([
        'parent',
        'quest',
        'id',
      ]);
    });

    it('VALID: {text: WorkItem} => returns work, item', () => {
      expect(camelWordsSplitTransformer({ text: 'WorkItem' })).toStrictEqual(['work', 'item']);
    });

    it('VALID: {text: parseURLPath} => keeps the acronym run together', () => {
      expect(camelWordsSplitTransformer({ text: 'parseURLPath' })).toStrictEqual([
        'parse',
        'url',
        'path',
      ]);
    });

    it('VALID: {text: requestId} => returns request, id and not quest, id', () => {
      expect(camelWordsSplitTransformer({ text: 'requestId' })).toStrictEqual(['request', 'id']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {text: empty} => returns no words', () => {
      expect(camelWordsSplitTransformer({ text: '' })).toStrictEqual([]);
    });
  });
});
