import { snapshotsArgsParseTransformer } from './snapshots-args-parse-transformer';

describe('snapshotsArgsParseTransformer', () => {
  describe('the full flag set', () => {
    it('VALID: {args: [--instance, inst_7f3a9c21, --json]} => the complete parsed object with json true', () => {
      const result = snapshotsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--json'],
      });

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', json: true });
    });

    it('VALID: {args: [--instance, inst_9b2c4d1e]} => --json is optional and defaults to false', () => {
      const result = snapshotsArgsParseTransformer({ args: ['--instance', 'inst_9b2c4d1e'] });

      expect(result).toStrictEqual({ instanceId: 'inst_9b2c4d1e', json: false });
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => snapshotsArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --json\n\nUsage: dungeonmaster siegelense snapshots --instance <instanceId> \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws naming it', () => {
      expect(() => snapshotsArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense snapshots --instance <instanceId> \[--json\]$/u,
      );
    });
  });
});
