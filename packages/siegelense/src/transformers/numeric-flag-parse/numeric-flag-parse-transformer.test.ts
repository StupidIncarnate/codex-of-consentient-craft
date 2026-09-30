import { z } from '#gateway/npm/zod';

import { numericFlagParseTransformer } from './numeric-flag-parse-transformer';

describe('numericFlagParseTransformer', () => {
  describe('a value the parse callback accepts', () => {
    it('VALID: {raw: "3"} => returns the parsed number', () => {
      const result = numericFlagParseTransformer({
        flag: '--pool',
        raw: '3',
        accepts: 'a whole number of 1 or more',
        parse: (value) => value,
      });

      expect(result).toBe(3);
    });
  });

  describe('a ZodError for a non-numeric raw value', () => {
    it('INVALID: {raw: "abc"} => throws naming the flag, what it accepts, and the exact text typed', () => {
      const zodError = new z.ZodError([
        { code: 'custom', message: 'Expected number, received nan', path: [] },
      ]);

      expect(() =>
        numericFlagParseTransformer({
          flag: '--pool',
          raw: 'abc',
          accepts: 'a whole number of 1 or more',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--pool must be a whole number of 1 or more; got "abc"$/u);
    });
  });

  describe('a ZodError for a value below the contract bound', () => {
    it('INVALID: {raw: "0"} => throws naming the flag, what it accepts, and the exact text typed', () => {
      const zodError = new z.ZodError([
        { code: 'custom', message: 'Number must be greater than 0', path: [] },
      ]);

      expect(() =>
        numericFlagParseTransformer({
          flag: '--pool',
          raw: '0',
          accepts: 'a whole number of 1 or more',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--pool must be a whole number of 1 or more; got "0"$/u);
    });
  });

  describe('a ZodError for a float the contract requires as an integer', () => {
    it('INVALID: {raw: "1.5"} => throws naming the flag, what it accepts, and the exact text typed', () => {
      const zodError = new z.ZodError([
        { code: 'custom', message: 'Expected integer, received float', path: [] },
      ]);

      expect(() =>
        numericFlagParseTransformer({
          flag: '--pool',
          raw: '1.5',
          accepts: 'a whole number of 1 or more',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--pool must be a whole number of 1 or more; got "1.5"$/u);
    });
  });

  describe('a non-Zod error', () => {
    it('ERROR: {parse throws a plain Error} => rethrows it unchanged, never wrapped with the flag', () => {
      const plainError = new Error('driver socket refused the connection');

      expect(() =>
        numericFlagParseTransformer({
          flag: '--pool',
          raw: '3',
          accepts: 'a whole number of 1 or more',
          parse: (): never => {
            throw plainError;
          },
        }),
      ).toThrow(/^driver socket refused the connection$/u);
    });
  });
});
