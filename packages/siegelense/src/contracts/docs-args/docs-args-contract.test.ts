import { docsArgsContract } from './docs-args-contract';
import { DocsArgsStub } from './docs-args.stub';

describe('docsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {scope: null, human: false} => the whole-surface JSON form parses', () => {
      const args = DocsArgsStub({ scope: null, human: false });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: null, human: false });
    });

    it('VALID: {scope: "walking", human: true} => one scope, rendered, parses', () => {
      const args = DocsArgsStub({ scope: 'walking', human: true });

      const result = docsArgsContract.parse(args);

      expect(result).toStrictEqual({ scope: 'walking', human: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {scope: "reader"} => raises exactly one issue, scoped to scope', () => {
      const result = docsArgsContract.safeParse({ scope: 'reader', human: false });

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

    it('INVALID: {missing human} => raises exactly one issue, scoped to human', () => {
      const result = docsArgsContract.safeParse({ scope: null });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['human'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instance"} => throws Unrecognized key, because docs needs no instance', () => {
      expect(() =>
        docsArgsContract.parse({ scope: null, human: false, instance: 'inst_7f3a9c21' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
