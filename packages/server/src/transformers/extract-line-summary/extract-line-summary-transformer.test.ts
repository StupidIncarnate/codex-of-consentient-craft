import { extractLineSummaryTransformer } from './extract-line-summary-transformer';

describe('extractLineSummaryTransformer', () => {
  describe('summary extraction', () => {
    it('VALID: {parsed: {type: "summary", summary: "Built login"}} => returns summary', () => {
      const result = extractLineSummaryTransformer({
        parsed: { type: 'summary', summary: 'Built login' },
      });

      expect(result).toBe('Built login');
    });

    it('VALID: {parsed: {type: "assistant"}} => returns undefined for non-summary type', () => {
      const result = extractLineSummaryTransformer({
        parsed: { type: 'assistant', message: 'hello' },
      });

      expect(result).toBeUndefined();
    });

    it('VALID: {parsed: null} => returns undefined for null', () => {
      const result = extractLineSummaryTransformer({ parsed: null });

      expect(result).toBeUndefined();
    });

    it('VALID: {parsed: "string"} => returns undefined for non-object', () => {
      const result = extractLineSummaryTransformer({ parsed: 'a string' });

      expect(result).toBeUndefined();
    });

    it('VALID: {parsed: {type: "summary", summary: 123}} => returns undefined for non-string summary', () => {
      const result = extractLineSummaryTransformer({
        parsed: { type: 'summary', summary: 123 },
      });

      expect(result).toBeUndefined();
    });
  });
});
