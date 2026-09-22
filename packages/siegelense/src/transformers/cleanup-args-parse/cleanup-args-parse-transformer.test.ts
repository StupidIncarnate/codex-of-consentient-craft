import { cleanupArgsParseTransformer } from './cleanup-args-parse-transformer';

describe('cleanupArgsParseTransformer', () => {
  describe('the accepted flags', () => {
    it('EMPTY: {args: []} => the human default', () => {
      const result = cleanupArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ isJson: false });
    });

    it('VALID: {args: [--json]} => json flag parses to raw JSON output', () => {
      const result = cleanupArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({ isJson: true });
    });

    it('INVALID: {args: [--human]} => --human is refused as an unknown flag', () => {
      expect(() => cleanupArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nTakes no input: it reaps stale instances and ages assets on their own windows, with nothing to select\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense cleanup \[--json\]$/u,
      );
    });
  });

  describe('the flag --instance specifically', () => {
    it('INVALID: {args: [--instance, inst_x]} => throws naming --instance and stating cleanup takes no input', () => {
      expect(() => cleanupArgsParseTransformer({ args: ['--instance', 'inst_x'] })).toThrow(
        /^Unknown flag: --instance\n\nTakes no input: it reaps stale instances and ages assets on their own windows, with nothing to select\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense cleanup \[--json\]$/u,
      );
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => cleanupArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nTakes no input: it reaps stale instances and ages assets on their own windows, with nothing to select\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense cleanup \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws stating cleanup takes no input AND the canonical positional-argument sentence', () => {
      expect(() => cleanupArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nTakes no input: it reaps stale instances and ages assets on their own windows, with nothing to select\. Every value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense cleanup \[--json\]$/u,
      );
    });
  });
});
