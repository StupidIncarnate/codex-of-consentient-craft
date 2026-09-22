import { killArgsParseTransformer } from './kill-args-parse-transformer';

describe('killArgsParseTransformer', () => {
  describe('the full flag set', () => {
    it('VALID: {args: [--instance, inst_7f3a9c21]} => parses with isJson false by default', () => {
      const result = killArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21'],
      });

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', isJson: false });
    });

    it('VALID: {args: [--instance, inst_7f3a9c21, --json]} => the complete parsed object with isJson true', () => {
      const result = killArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--json'],
      });

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21', isJson: true });
    });
  });

  describe('the required flag missing entirely', () => {
    it('EMPTY: {args: []} => throws naming --instance as required', () => {
      expect(() => killArgsParseTransformer({ args: [] })).toThrow(
        /^--instance is required: kill needs an instance id to tear down\.\n\nUsage: dungeonmaster siegelense kill --instance <instanceId> \[--json\]$/u,
      );
    });
  });

  describe('a badly-shaped --instance', () => {
    it("INVALID: {args: [--instance, not-a-valid-id]} => throws naming --instance and the contract's own message", () => {
      expect(() => killArgsParseTransformer({ args: ['--instance', 'not-a-valid-id'] })).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => killArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --json\n\nUsage: dungeonmaster siegelense kill --instance <instanceId> \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws naming it', () => {
      expect(() => killArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense kill --instance <instanceId> \[--json\]$/u,
      );
    });
  });
});
