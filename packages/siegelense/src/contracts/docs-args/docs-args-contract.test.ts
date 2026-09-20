import { docsArgsContract } from './docs-args-contract';
import { DocsArgsStub } from './docs-args.stub';

describe('docsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {scope: "operating", json: false} => one scope with markdown default parses', () => {
      const args = DocsArgsStub({ scope: 'operating', json: false });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'operating', json: false });
    });

    it('VALID: {scope: "walking", json: true} => one scope with json parses', () => {
      const args = DocsArgsStub({ scope: 'walking', json: true });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'walking', json: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing scope} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ json: false });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected:
            "'operating' | 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving' | 'operational'",
          received: 'undefined',
          path: ['scope'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {scope: null} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ scope: null, json: false });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected:
            "'operating' | 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving' | 'operational'",
          received: 'null',
          path: ['scope'],
          message:
            "Expected 'operating' | 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving' | 'operational', received null",
        },
      ]);
    });

    it('INVALID: {scope: "reader"} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ scope: 'reader', json: false });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_enum_value',
          options: [
            'operating',
            'planning',
            'walking',
            'attacking',
            'fixing',
            'driving',
            'operational',
          ],
          path: ['scope'],
          received: 'reader',
          message:
            "Invalid enum value. Expected 'operating' | 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving' | 'operational', received 'reader'",
        },
      ]);
    });

    it('INVALID: {missing json} => raises exactly one issue, scoped to json', () => {
      const result = docsArgsContract.safeParse({ scope: 'operating' });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['json'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instance"} => throws Unrecognized key, because docs needs no instance', () => {
      expect(() =>
        docsArgsContract.parse({
          scope: 'operating',
          json: false,
          instance: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
