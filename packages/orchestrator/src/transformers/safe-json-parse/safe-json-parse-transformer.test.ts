import { safeJsonParseTransformer } from './safe-json-parse-transformer';

describe('safeJsonParseTransformer', () => {
  it('VALID: {value: JSON object string} => returns { ok: true, value }', () => {
    const result = safeJsonParseTransformer({ value: '{"a":1}' });

    expect(result).toStrictEqual({ ok: true, value: { a: 1 } });
  });

  it('VALID: {value: JSON array string} => returns { ok: true, value }', () => {
    const result = safeJsonParseTransformer({ value: '[1,2,3]' });

    expect(result).toStrictEqual({ ok: true, value: [1, 2, 3] });
  });

  it('INVALID: {value: malformed JSON} => returns { ok: false }', () => {
    const result = safeJsonParseTransformer({ value: 'not json' });

    expect(result).toStrictEqual({ ok: false });
  });

  it('EDGE: {value: empty string} => returns { ok: false }', () => {
    const result = safeJsonParseTransformer({ value: '' });

    expect(result).toStrictEqual({ ok: false });
  });
});
