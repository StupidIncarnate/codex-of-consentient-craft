import { docsArgsContract } from './docs-args-contract';
import { DocsArgsStub } from './docs-args.stub';

describe('docsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {scope: "planning", isJson: false} => one scope with markdown default parses', () => {
      const args = DocsArgsStub({ scope: 'planning', isJson: false });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'planning', isJson: false });
    });

    it('VALID: {scope: "walking", isJson: true} => one scope with json parses', () => {
      const args = DocsArgsStub({ scope: 'walking', isJson: true });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'walking', isJson: true });
    });

    it('EMPTY: {scope: null, isJson: false} => the bare-docs overview form parses', () => {
      const args = DocsArgsStub({ scope: null, isJson: false });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: null, isJson: false });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing scope} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ isJson: false });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: "'planning' | 'walking' | 'attacking' | 'fixing' | 'driving'",
          received: 'undefined',
          path: ['scope'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {scope: "reader"} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ scope: 'reader', isJson: false });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_enum_value',
          options: ['planning', 'walking', 'attacking', 'fixing', 'driving'],
          path: ['scope'],
          received: 'reader',
          message:
            "Invalid enum value. Expected 'planning' | 'walking' | 'attacking' | 'fixing' | 'driving', received 'reader'",
        },
      ]);
    });

    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = docsArgsContract.safeParse({ scope: 'planning' });

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
          scope: 'planning',
          isJson: false,
          instance: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
