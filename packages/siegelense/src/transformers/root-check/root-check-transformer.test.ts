import { rootCheckTransformer } from './root-check-transformer';

describe('rootCheckTransformer', () => {
  describe('checkSource()', () => {
    it('VALID: generates script that queries selector from healthStatics', () => {
      const rootCheck = rootCheckTransformer();

      const source = rootCheck.checkSource();

      expect(source).toBe('Boolean(document.querySelector("#root"))');
    });
  });

  describe('toResult()', () => {
    it('VALID: {raw: true} => returns true', () => {
      const rootCheck = rootCheckTransformer();

      expect(rootCheck.toResult({ raw: true })).toBe(true);
    });

    it('VALID: {raw: false} => returns false', () => {
      const rootCheck = rootCheckTransformer();

      expect(rootCheck.toResult({ raw: false })).toBe(false);
    });

    it('VALID: {raw: null} => returns false', () => {
      const rootCheck = rootCheckTransformer();

      expect(rootCheck.toResult({ raw: null })).toBe(false);
    });

    it('VALID: {raw: undefined} => returns false', () => {
      const rootCheck = rootCheckTransformer();

      expect(rootCheck.toResult({ raw: undefined })).toBe(false);
    });
  });
});
