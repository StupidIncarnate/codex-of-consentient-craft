import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { extractTimestampFromJsonlLineTransformer } from './extract-timestamp-from-jsonl-line-transformer';

describe('extractTimestampFromJsonlLineTransformer', () => {
  it('VALID: {line with timestamp} => returns parsed IsoTimestamp', () => {
    const result = extractTimestampFromJsonlLineTransformer({
      parsed: snakeKeysToCamelKeysTransformer({
        value: JSON.parse('{"type":"user","timestamp":"2025-01-15T10:00:00.000Z"}'),
      }),
    });

    expect(result).toBe('2025-01-15T10:00:00.000Z');
  });

  it('VALID: {line without timestamp} => returns epoch fallback', () => {
    const result = extractTimestampFromJsonlLineTransformer({
      parsed: snakeKeysToCamelKeysTransformer({
        value: JSON.parse('{"type":"system","subtype":"init"}'),
      }),
    });

    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });

  it('VALID: {line with non-string timestamp} => returns epoch fallback', () => {
    const result = extractTimestampFromJsonlLineTransformer({
      parsed: snakeKeysToCamelKeysTransformer({
        value: JSON.parse('{"type":"user","timestamp":12345}'),
      }),
    });

    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });
});
