import { truncateContentTransformer } from './truncate-content-transformer';
import { truncateContentTransformerProxy } from './truncate-content-transformer.proxy';

describe('truncateContentTransformer', () => {
  describe('character truncation', () => {
    it('VALID: {content exceeds 200 chars, few lines} => truncates at 200 chars', () => {
      truncateContentTransformerProxy();
      const content = 'x'.repeat(250);

      const result = truncateContentTransformer({ content });

      expect(result).toBe('x'.repeat(200));
    });
  });

  describe('line truncation', () => {
    it('VALID: {content exceeds 8 lines, short chars} => truncates at 8 lines', () => {
      truncateContentTransformerProxy();
      const lines = Array.from({ length: 12 }, (_, i) => `line ${i}`);
      const content = lines.join('\n');

      const result = truncateContentTransformer({ content });

      expect(result).toBe(lines.slice(0, 8).join('\n'));
    });
  });

  describe('short content', () => {
    it('VALID: {short content} => returns content as-is', () => {
      truncateContentTransformerProxy();

      const result = truncateContentTransformer({ content: 'short' });

      expect(result).toBe('short');
    });
  });
});
