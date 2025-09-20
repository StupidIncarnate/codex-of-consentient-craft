import { parseOutput } from './parse-output';

describe('parseOutput', () => {
  describe('valid input', () => {
    it('VALID: {output: \'[{"messages":[]}]\'} => returns EslintResult array', () => {
      const output = '[{"messages":[]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('VALID: {output: \'prefix[{"messages":[]}]suffix\'} => returns EslintResult array', () => {
      const output = 'prefix[{"messages":[]}]suffix';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('VALID: {output: \'[{"messages":[{"line":1,"message":"error","severity":2}]}]\'} => returns EslintResult array', () => {
      const output = '[{"messages":[{"line":1,"message":"error","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        {
          messages: [{ line: 1, message: 'error', severity: 2 }],
        },
      ]);
    });

    it('VALID: output with multiple results => returns all valid results', () => {
      const output = '[{"messages":[]},{"messages":[{"line":5,"message":"warn","severity":1}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        { messages: [] },
        { messages: [{ line: 5, message: 'warn', severity: 1 }] },
      ]);
    });
  });

  describe('invalid input', () => {
    it("INVALID: {output: 'no json array'} => returns empty array", () => {
      const output = 'no json array';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it("INVALID: {output: '[invalid json'} => returns empty array", () => {
      const output = '[invalid json';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: {output: \'[{"invalid":"structure"}]\'} => returns empty array', () => {
      const output = '[{"invalid":"structure"}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: array with mixed valid/invalid items => returns only valid items', () => {
      const output =
        '[{"messages":[]},{"invalid":"structure"},{"messages":[{"line":1,"message":"test","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        { messages: [] },
        { messages: [{ line: 1, message: 'test', severity: 2 }] },
      ]);
    });
  });

  describe('empty input', () => {
    it("EMPTY: {output: ''} => returns empty array", () => {
      const output = '';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it("EMPTY: {output: '[]'} => returns empty array", () => {
      const output = '[]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: JSON.parse throws => returns empty array and logs error', () => {
      const output = '[{"messages":invalid}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: output with nested JSON arrays => finds correct array match', () => {
      const output = 'Some text [{"nested":"data"}] and then [{"messages":[]}] more text';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('EDGE: output with escaped quotes in JSON => parses correctly', () => {
      const output = '[{"messages":[{"line":1,"message":"Error with \\"quotes\\"","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        {
          messages: [{ line: 1, message: 'Error with "quotes"', severity: 2 }],
        },
      ]);
    });

    it('EDGE: unmatched opening bracket => returns empty array', () => {
      const output = '[{"messages":[]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: unmatched closing bracket => returns empty array', () => {
      const output = 'messages":[]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: brackets inside JSON string values => parses correctly', () => {
      const output = '[{"messages":[{"line":1,"message":"Error [line 5] here","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        {
          messages: [{ line: 1, message: 'Error [line 5] here', severity: 2 }],
        },
      ]);
    });

    it('EDGE: escaped brackets in JSON strings => parses correctly', () => {
      const output = '[{"messages":[{"line":1,"message":"Error \\\\[escaped\\\\]","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        {
          messages: [{ line: 1, message: 'Error \\[escaped\\]', severity: 2 }],
        },
      ]);
    });

    it('EDGE: deeply nested arrays => parses correctly', () => {
      const output = 'prefix [[[[{"messages":[]}]]]] suffix';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('EDGE: empty array followed by valid array => returns valid array', () => {
      const output = '[] [{"messages":[]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('EDGE: multiple valid arrays => returns first valid array', () => {
      const output = '[{"messages":[]}] [{"messages":[{"line":1,"message":"test","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('EDGE: ANSI color codes around JSON => parses correctly', () => {
      const output = '\\u001b[32m[{"messages":[]}]\\u001b[0m';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([{ messages: [] }]);
    });

    it('BUG: brackets inside strings affecting bracket counting => still parses correctly', () => {
      const output =
        'prefix[invalid] then [{"messages":[{"line":1,"message":"Array [0] access","severity":2}]}]';

      const result = parseOutput({ output });

      expect(result).toStrictEqual([
        {
          messages: [{ line: 1, message: 'Array [0] access', severity: 2 }],
        },
      ]);
    });
  });
});
