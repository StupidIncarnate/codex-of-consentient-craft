import { parsedToolInputContract } from './parsed-tool-input-contract';
import { ParsedToolInputStub } from './parsed-tool-input.stub';

describe('parsedToolInputContract', () => {
  describe('valid records', () => {
    it('VALID: {single key} => parses successfully', () => {
      const value = ParsedToolInputStub();

      const result = parsedToolInputContract.parse(value);

      expect(result).toStrictEqual({
        command: 'ls',
      });
    });

    it('EMPTY: {empty object} => parses successfully', () => {
      const result = parsedToolInputContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid records', () => {
    it('INVALID: {non-object} => throws validation error', () => {
      expect(() => {
        parsedToolInputContract.parse('not an object');
      }).toThrow(/Expected object/u);
    });
  });
});
