import { streamJsonLinesFromRawTransformer } from './stream-json-lines-from-raw-transformer';

describe('streamJsonLinesFromRawTransformer', () => {
  describe('trimming', () => {
    it('VALID: {padded lines} => returns each line trimmed', () => {
      const result = streamJsonLinesFromRawTransformer({
        rawLines: ['  {"type":"system"}', '{"type":"assistant"}\r'],
      });

      expect(result).toStrictEqual(['{"type":"system"}', '{"type":"assistant"}']);
    });
  });

  describe('blank lines', () => {
    it('VALID: {whitespace-only line between two lines} => drops the blank line', () => {
      const result = streamJsonLinesFromRawTransformer({
        rawLines: ['{"type":"system"}', '   \t', '{"type":"assistant"}'],
      });

      expect(result).toStrictEqual(['{"type":"system"}', '{"type":"assistant"}']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {rawLines: []} => returns []', () => {
      const result = streamJsonLinesFromRawTransformer({ rawLines: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
