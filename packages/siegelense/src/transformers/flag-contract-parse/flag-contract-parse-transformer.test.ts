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

  describe('a ZodError-shaped throw with one root-level issue', () => {
    it('INVALID: {parse throws it} => throws "flag: message", dropping the issue array structure', () => {
      const zodIssueError = Object.assign(new Error('ignored'), {
        issues: [
          {
            message: "Invalid enum value. Expected 'error' | 'never', received 'maybe'",
            path: [],
          },
        ],
      });

      expect(() =>
        flagContractParseTransformer({
          flag: '--stop-on',
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(/^--stop-on: Invalid enum value\. Expected 'error' \| 'never', received 'maybe'$/u);
    });
  });

  describe('a ZodError-shaped throw with a nested path', () => {
    it('INVALID: {parse throws an issue with path ["steps", 0]} => throws the path joined before the message', () => {
      const zodIssueError = Object.assign(new Error('ignored'), {
        issues: [{ message: "Unrecognized key(s) in object: 'bogus'", path: ['steps', 0] }],
      });

      expect(() =>
        flagContractParseTransformer({
          flag: '--steps',
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(/^--steps: steps\.0: Unrecognized key\(s\) in object: 'bogus'$/u);
    });
  });

  describe('a ZodError-shaped throw with more than one issue', () => {
    it('INVALID: {parse throws two issues} => throws both, joined by "; ", losing neither', () => {
      const zodIssueError = Object.assign(new Error('ignored'), {
        issues: [
          { message: 'Required', path: ['a'] },
          { message: 'Required', path: ['b'] },
        ],
      });

      expect(() =>
        flagContractParseTransformer({
          flag: '--fields',
          parse: (): never => {
            throw zodIssueError;
          },
        }),
      ).toThrow(/^--fields: a: Required; b: Required$/u);
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
