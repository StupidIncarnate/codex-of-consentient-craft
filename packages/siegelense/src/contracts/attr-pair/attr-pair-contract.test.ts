import { attrPairContract } from './attr-pair-contract';
import { AttrPairStub } from './attr-pair.stub';

describe('attrPairContract', () => {
  describe('valid values', () => {
    it("VALID: {name: data-status, value: failed} => parses the app's own state word", () => {
      const pair = AttrPairStub({ name: 'data-status', value: 'failed' });

      const result = attrPairContract.parse(pair);

      expect(result).toStrictEqual({ name: 'data-status', value: 'failed' });
    });

    it('VALID: {name: href, value: an arrow form} => parses the already-rendered compact link', () => {
      const pair = AttrPairStub({ name: 'href', value: '→ /queue' });

      const result = attrPairContract.parse(pair);

      expect(result).toStrictEqual({ name: 'href', value: '→ /queue' });
    });

    it('VALID: {name: href, value: an arrow form with the new-tab glyph} => parses', () => {
      const pair = AttrPairStub({ name: 'href', value: '→ /docs ↗' });

      const result = attrPairContract.parse(pair);

      expect(result).toStrictEqual({ name: 'href', value: '→ /docs ↗' });
    });
  });

  describe('invalid values', () => {
    it('INVALID: {missing value} => throws Required', () => {
      expect(() => attrPairContract.parse({ name: 'href' })).toThrow(/Required/u);
    });

    it('INVALID: {name: 42} => throws, because an attribute name is text', () => {
      expect(() => attrPairContract.parse({ name: 42, value: 'failed' })).toThrow(
        /Expected string/u,
      );
    });
  });
});
