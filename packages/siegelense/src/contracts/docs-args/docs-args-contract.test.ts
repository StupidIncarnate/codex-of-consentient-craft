import { docsArgsContract } from './docs-args-contract';
import { DocsArgsStub } from './docs-args.stub';

describe('docsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {scope: "operating", isJson: false} => one scope with markdown default parses', () => {
      const args = DocsArgsStub({ scope: 'operating', isJson: false });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'operating', isJson: false });
    });

    it('VALID: {scope: "walking", isJson: true} => one scope with json parses', () => {
      const args = DocsArgsStub({ scope: 'walking', isJson: true });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'walking', isJson: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing scope} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ isJson: false });

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
      const result = docsArgsContract.safeParse({ scope: null, isJson: false });

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
      const result = docsArgsContract.safeParse({ scope: 'reader', isJson: false });

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

    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = docsArgsContract.safeParse({ scope: 'operating' });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['isJson'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instance"} => throws Unrecognized key, because docs needs no instance', () => {
      expect(() =>
        docsArgsContract.parse({
          scope: 'operating',
          isJson: false,
          instance: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
