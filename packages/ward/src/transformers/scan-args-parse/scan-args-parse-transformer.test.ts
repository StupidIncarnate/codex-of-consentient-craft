import { scanArgsParseTransformer } from './scan-args-parse-transformer';

describe('scanArgsParseTransformer', () => {
  describe('valid input', () => {
    it('VALID: {rule only} => returns the rule with no paths', () => {
      const result = scanArgsParseTransformer({
        args: ['@dungeonmaster/ban-primitives'],
      });

      expect(result).toStrictEqual({ rule: '@dungeonmaster/ban-primitives', paths: [] });
    });

    it('VALID: {rule, --, two paths} => returns both paths in order', () => {
      const result = scanArgsParseTransformer({
        args: ['no-console', '--', 'packages/ward', 'packages/hooks/src/a.ts'],
      });

      expect(result).toStrictEqual({
        rule: 'no-console',
        paths: ['packages/ward', 'packages/hooks/src/a.ts'],
      });
    });

    it('EDGE: {rule, bare --} => returns no paths', () => {
      const result = scanArgsParseTransformer({
        args: ['no-console', '--'],
      });

      expect(result).toStrictEqual({ rule: 'no-console', paths: [] });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {no args} => throws the usage line', () => {
      expect(() => scanArgsParseTransformer({ args: [] })).toThrow(
        /^scan needs a rule name first\.\nUsage: npm run ward -- scan <rule> \[-- <files or packages>\]$/u,
      );
    });

    it('INVALID: {first arg is a flag} => throws the usage line', () => {
      expect(() => scanArgsParseTransformer({ args: ['--only'] })).toThrow(
        /^scan needs a rule name first\./u,
      );
    });

    it('INVALID: {second word before --} => throws naming the stray argument', () => {
      expect(() =>
        scanArgsParseTransformer({
          args: ['no-console', 'extra'],
        }),
      ).toThrow(
        /^scan takes one rule; unexpected argument\(s\): extra\nUsage: npm run ward -- scan <rule> \[-- <files or packages>\]$/u,
      );
    });

    it('INVALID: {flag after --} => throws naming the flag', () => {
      expect(() =>
        scanArgsParseTransformer({
          args: ['no-console', '--', '--fix'],
        }),
      ).toThrow(
        /^Flags after "--" are not forwarded: --fix\nUsage: npm run ward -- scan <rule> \[-- <files or packages>\]$/u,
      );
    });
  });
});
