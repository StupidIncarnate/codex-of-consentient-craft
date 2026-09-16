import { statusArgsParseTransformer } from './status-args-parse-transformer';

describe('statusArgsParseTransformer', () => {
  describe('the full flag set', () => {
    it('VALID: {args: [--instance, inst_7f3a9c21, --human, --json]} => the complete parsed object', () => {
      const result = statusArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--human', '--json'],
      });

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', human: true });
    });
  });

  describe('no args', () => {
    it('EMPTY: {args: []} => the bare fleet-JSON default', () => {
      const result = statusArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ instanceId: null, human: false });
    });
  });

  describe('--instance with no value', () => {
    it('INVALID: {args: [--instance]} => throws naming the flag as required', () => {
      expect(() => statusArgsParseTransformer({ args: ['--instance'] })).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => statusArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --json, --human\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--json\] \[--human\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws naming it', () => {
      expect(() => statusArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--json\] \[--human\]$/u,
      );
    });
  });
});
