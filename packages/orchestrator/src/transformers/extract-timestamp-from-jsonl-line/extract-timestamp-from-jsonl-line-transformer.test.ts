import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

import { extractTimestampFromJsonlLineTransformer } from './extract-timestamp-from-jsonl-line-transformer';

describe('extractTimestampFromJsonlLineTransformer', () => {
  it('VALID: {line with timestamp} => returns parsed IsoTimestamp', () => {
    const line = StreamJsonLineStub({
      value: '{"type":"user","timestamp":"2025-01-15T10:00:00.000Z"}',
    });

    const result = extractTimestampFromJsonlLineTransformer({ line });

    expect(result).toBe('2025-01-15T10:00:00.000Z');
  });

  it('VALID: {line without timestamp} => returns epoch fallback', () => {
    const line = StreamJsonLineStub({
      value: '{"type":"system","subtype":"init"}',
    });

    const result = extractTimestampFromJsonlLineTransformer({ line });

    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });

  it('VALID: {line with non-string timestamp} => returns epoch fallback', () => {
    const line = StreamJsonLineStub({
      value: '{"type":"user","timestamp":12345}',
    });

    const result = extractTimestampFromJsonlLineTransformer({ line });

    expect(result).toBe('1970-01-01T00:00:00.000Z');
  });
});
