import { safeJsonParseTransformer } from './safe-json-parse-transformer';

describe('safeJsonParseTransformer', () => {
  describe('valid JSON', () => {
    it('VALID: {value: "{\\"a\\":1}"} => returns ok with parsed object', () => {
      expect(safeJsonParseTransformer({ value: '{"a":1}' })).toStrictEqual({
        ok: true,
        value: { a: 1 },
      });
    });

    it('VALID: {value: "[1,2,3]"} => returns ok with parsed array', () => {
      expect(safeJsonParseTransformer({ value: '[1,2,3]' })).toStrictEqual({
        ok: true,
        value: [1, 2, 3],
      });
    });

    it('VALID: {value: "42"} => returns ok with primitive number', () => {
      expect(safeJsonParseTransformer({ value: '42' })).toStrictEqual({
        ok: true,
        value: 42,
      });
    });

    it('VALID: {value: "null"} => returns ok with null', () => {
      expect(safeJsonParseTransformer({ value: 'null' })).toStrictEqual({
        ok: true,
        value: null,
      });
    });
  });

  describe('parse failures', () => {
    it('ERROR: {value: "not json"} => returns {ok: false}', () => {
      expect(safeJsonParseTransformer({ value: 'not json' })).toStrictEqual({
        ok: false,
      });
    });

    it('ERROR: {value: ""} => returns {ok: false}', () => {
      expect(safeJsonParseTransformer({ value: '' })).toStrictEqual({
        ok: false,
      });
    });

    it('ERROR: {value: "{broken"} => returns {ok: false}', () => {
      expect(safeJsonParseTransformer({ value: '{broken' })).toStrictEqual({
        ok: false,
      });
    });
  });
});
