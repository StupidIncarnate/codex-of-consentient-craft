import { isRegexLiteralGuard } from './is-regex-literal-guard';
import { LiteralValueStub } from '../../contracts/literal-value/literal-value.stub';

describe('isRegexLiteralGuard', () => {
  describe('valid regex patterns', () => {
    it('VALID: {value: "/test/g"} => returns true', () => {
      const value = LiteralValueStub({ value: '/test/g' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(true);
    });

    it('VALID: {value: "/test/"} => returns true', () => {
      const value = LiteralValueStub({ value: '/test/' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(true);
    });

    it('VALID: {value: "/test/gimsu"} => returns true', () => {
      const value = LiteralValueStub({ value: '/test/gimsu' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(true);
    });

    it('VALID: {value: "/^[a-z]+$/i"} => returns true', () => {
      const value = LiteralValueStub({ value: '/^[a-z]+$/i' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(true);
    });
  });

  describe('non-regex patterns', () => {
    it('VALID: {value: "test"} => returns false', () => {
      const value = LiteralValueStub({ value: 'test' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(false);
    });

    it('VALID: {value: "/test"} => returns false', () => {
      const value = LiteralValueStub({ value: '/test' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(false);
    });

    it('VALID: {value: "test/"} => returns false', () => {
      const value = LiteralValueStub({ value: 'test/' });

      const result = isRegexLiteralGuard({ value });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: undefined} => returns false', () => {
      const result = isRegexLiteralGuard({});

      expect(result).toBe(false);
    });
  });
});
