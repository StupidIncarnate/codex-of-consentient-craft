import { parsedToolResultContract } from './parsed-tool-result-contract';
import { ParsedToolResultStub } from './parsed-tool-result.stub';

describe('parsedToolResultContract', () => {
  describe('valid records', () => {
    it('VALID: {name: "codeweaver"} => parses successfully', () => {
      const value = ParsedToolResultStub();

      const result = parsedToolResultContract.parse(value);

      expect(result).toStrictEqual({ name: 'codeweaver' });
    });

    it('VALID: {mixed value types} => keeps every value untouched', () => {
      const result = parsedToolResultContract.parse({
        name: 'codeweaver',
        rounds: 3,
        nested: { a: 1 },
      });

      expect(result).toStrictEqual({ name: 'codeweaver', rounds: 3, nested: { a: 1 } });
    });

    it('EMPTY: {} => parses to an empty record', () => {
      const result = parsedToolResultContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid records', () => {
    it('INVALID: {non-object} => throws validation error', () => {
      expect(() => {
        parsedToolResultContract.parse('not an object');
      }).toThrow(/Expected object/u);
    });
  });
});
