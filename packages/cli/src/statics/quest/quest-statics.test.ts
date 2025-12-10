import { questStatics } from './quest-statics';

describe('questStatics', () => {
  describe('phases', () => {
    it('VALID: order => returns phase types in correct order', () => {
      expect(questStatics.phases.order).toStrictEqual([
        'discovery',
        'implementation',
        'testing',
        'review',
      ]);
    });

    it('VALID: order length => has 4 phases', () => {
      expect(questStatics.phases.order).toHaveLength(4);
    });
  });
});
