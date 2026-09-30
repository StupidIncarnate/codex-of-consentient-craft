import { z } from '#gateway/npm/zod';

import { flagContractParseTransformer } from './flag-contract-parse-transformer';

describe('flagContractParseTransformer', () => {
  describe('a successful parse', () => {
    it('VALID: {parse resolves to a value} => returns it unchanged', () => {
      const result = flagContractParseTransformer({
        flag: '--instance',
        parse: () => 'inst_7f3a9c21',
      });

      expect(result).toBe('inst_7f3a9c21');
    });
  });

  describe('a ZodError with one root-level issue', () => {
    it('INVALID: {parse throws it} => throws "flag: message", dropping the issue array structure', () => {
      const zodError = new z.ZodError([
        {
          code: 'custom',
          message: "Invalid enum value. Expected 'error' | 'never', received 'maybe'",
          path: [],
        },
      ]);

      expect(() =>
        flagContractParseTransformer({
          flag: '--stop-on',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--stop-on: Invalid enum value\. Expected 'error' \| 'never', received 'maybe'$/u);
    });
  });

  describe('a ZodError for an enum value', () => {
    it('INVALID: {root-level invalid_value with values and input} => throws "flag must be one of <options>; got "<typed>"", never Zod wording', () => {
      const zodIssueError = new z.ZodError([
        {
          code: 'invalid_value',
          values: ['error', 'warn', 'info'],
          input: 'warning',
          message: 'Invalid option: expected one of "error"|"warn"|"info"',
          path: [],
        },
      ]);

      expect(() =>
        flagContractParseTransformer({
          flag: '--where-level',
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(/^--where-level must be one of error, warn, info; got "warning"$/u);
    });

    it('INVALID: {invalid_value nested at path ["steps", 0, "level"]} => throws the path before the enum sentence', () => {
      const zodIssueError = new z.ZodError([
        {
          code: 'invalid_value',
          values: ['page', 'state', 'instance'],
          input: 'everything',
          message: 'Invalid option: expected one of "page"|"state"|"instance"',
          path: ['steps', 0, 'level'],
        },
      ]);

      expect(() =>
        flagContractParseTransformer({
          flag: '--steps',
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(
        /^--steps: steps\.0\.level: must be one of page, state, instance; got "everything"$/u,
      );
    });
  });

  describe('a ZodError with a nested path', () => {
    it('INVALID: {parse throws an issue with path ["steps", 0]} => throws the path joined before the message', () => {
      const zodError = new z.ZodError([
        {
          code: 'custom',
          message: "Unrecognized key(s) in object: 'bogus'",
          path: ['steps', 0],
        },
      ]);

      expect(() =>
        flagContractParseTransformer({
          flag: '--steps',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--steps: steps\.0: Unrecognized key\(s\) in object: 'bogus'$/u);
    });
  });

  describe('a ZodError with more than one issue', () => {
    it('INVALID: {parse throws two issues} => throws both, joined by "; ", losing neither', () => {
      const zodError = new z.ZodError([
        { code: 'custom', message: 'received undefined', path: ['a'] },
        { code: 'custom', message: 'received undefined', path: ['b'] },
      ]);

      expect(() =>
        flagContractParseTransformer({
          flag: '--fields',
          parse: (): never => {
            throw zodError;
          },
        }),
      ).toThrow(/^--fields: a: received undefined; b: received undefined$/u);
    });
  });

  describe('a non-Zod error', () => {
    it('ERROR: {parse throws a plain Error with no issues field} => rethrows it unchanged, never prefixed with the flag', () => {
      const plainError = new Error('driver socket refused the connection');

      expect(() =>
        flagContractParseTransformer({
          flag: '--instance',
          parse: (): never => {
            throw plainError;
          },
        }),
      ).toThrow(/^driver socket refused the connection$/u);
    });
  });
});
