import { ContextTokenCountStub } from '../../contracts/context-token-count/context-token-count.stub';
import { formatContextTokensTransformer } from './format-context-tokens-transformer';

describe('formatContextTokensTransformer', () => {
  describe('abbreviated format (>= 1000)', () => {
    it('VALID: {count: 29448} => returns "29.4k"', () => {
      const count = ContextTokenCountStub({ value: 29448 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('29.4k');
    });

    it('VALID: {count: 1000} => returns "1.0k"', () => {
      const count = ContextTokenCountStub({ value: 1000 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('1.0k');
    });

    it('VALID: {count: 1500} => returns "1.5k"', () => {
      const count = ContextTokenCountStub({ value: 1500 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('1.5k');
    });

    it('VALID: {count: 100000} => returns "100.0k"', () => {
      const count = ContextTokenCountStub({ value: 100000 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('100.0k');
    });
  });

  describe('raw format (< 1000)', () => {
    it('VALID: {count: 150} => returns "150"', () => {
      const count = ContextTokenCountStub({ value: 150 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('150');
    });

    it('VALID: {count: 999} => returns "999"', () => {
      const count = ContextTokenCountStub({ value: 999 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('999');
    });

    it('VALID: {count: 1} => returns "1"', () => {
      const count = ContextTokenCountStub({ value: 1 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('1');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {count: 0} => returns "0"', () => {
      const count = ContextTokenCountStub({ value: 0 });

      const result = formatContextTokensTransformer({ count });

      expect(result).toBe('0');
    });
  });
});
