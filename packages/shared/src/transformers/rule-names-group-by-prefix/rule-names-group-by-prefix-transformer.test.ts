import { ruleNamesGroupByPrefixTransformer } from './rule-names-group-by-prefix-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('ruleNamesGroupByPrefixTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {ruleNames: []} => returns empty array', () => {
      const result = ruleNamesGroupByPrefixTransformer({ ruleNames: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single prefix', () => {
    it('VALID: {single ban rule} => one group with prefix ban', () => {
      const result = ruleNamesGroupByPrefixTransformer({
        ruleNames: [ContentTextStub({ value: 'ban-primitives' })],
      });

      expect(result).toStrictEqual([
        {
          prefix: ContentTextStub({ value: 'ban' }),
          names: [ContentTextStub({ value: 'ban-primitives' })],
        },
      ]);
    });

    it('VALID: {two ban rules} => one group with both names', () => {
      const result = ruleNamesGroupByPrefixTransformer({
        ruleNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'ban-silent-catch' }),
        ],
      });

      expect(result).toStrictEqual([
        {
          prefix: ContentTextStub({ value: 'ban' }),
          names: [
            ContentTextStub({ value: 'ban-primitives' }),
            ContentTextStub({ value: 'ban-silent-catch' }),
          ],
        },
      ]);
    });
  });

  describe('multi-prefix grouping', () => {
    it('VALID: {ban and enforce rules} => two groups in insertion order', () => {
      const result = ruleNamesGroupByPrefixTransformer({
        ruleNames: [
          ContentTextStub({ value: 'ban-primitives' }),
          ContentTextStub({ value: 'enforce-project-structure' }),
          ContentTextStub({ value: 'ban-silent-catch' }),
        ],
      });

      expect(result).toStrictEqual([
        {
          prefix: ContentTextStub({ value: 'ban' }),
          names: [
            ContentTextStub({ value: 'ban-primitives' }),
            ContentTextStub({ value: 'ban-silent-catch' }),
          ],
        },
        {
          prefix: ContentTextStub({ value: 'enforce' }),
          names: [ContentTextStub({ value: 'enforce-project-structure' })],
        },
      ]);
    });

    it('VALID: {unknown prefix rule} => group with prefix other', () => {
      const result = ruleNamesGroupByPrefixTransformer({
        ruleNames: [ContentTextStub({ value: 'custom-rule' })],
      });

      expect(result).toStrictEqual([
        {
          prefix: ContentTextStub({ value: 'other' }),
          names: [ContentTextStub({ value: 'custom-rule' })],
        },
      ]);
    });
  });
});
