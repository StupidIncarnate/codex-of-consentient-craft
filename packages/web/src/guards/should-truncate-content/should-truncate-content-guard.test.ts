import { shouldTruncateContentGuard } from './should-truncate-content-guard';

describe('shouldTruncateContentGuard', () => {
  describe('character limit', () => {
    it('VALID: {content exceeds 200 chars} => returns true', () => {
      const result = shouldTruncateContentGuard({ content: 'x'.repeat(201) });

      expect(result).toBe(true);
    });

    it('VALID: {content exactly 200 chars} => returns false', () => {
      const result = shouldTruncateContentGuard({ content: 'x'.repeat(200) });

      expect(result).toBe(false);
    });
  });

  describe('line limit', () => {
    it('VALID: {content exceeds 8 lines} => returns true', () => {
      const result = shouldTruncateContentGuard({
        content: 'line\nline\nline\nline\nline\nline\nline\nline\nline',
      });

      expect(result).toBe(true);
    });

    it('VALID: {content exactly 8 lines} => returns false', () => {
      const result = shouldTruncateContentGuard({
        content: 'line\nline\nline\nline\nline\nline\nline\nline',
      });

      expect(result).toBe(false);
    });
  });

  describe('short content', () => {
    it('VALID: {short single line content} => returns false', () => {
      const result = shouldTruncateContentGuard({ content: 'short' });

      expect(result).toBe(false);
    });
  });

  describe('undefined content', () => {
    it('EMPTY: {content is undefined} => returns false', () => {
      const result = shouldTruncateContentGuard({});

      expect(result).toBe(false);
    });
  });
});
