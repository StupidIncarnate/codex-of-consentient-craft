import { snapshotsArgsParseTransformer } from './snapshots-args-parse-transformer';

describe('snapshotsArgsParseTransformer', () => {
  describe('the full flag set', () => {
    it('VALID: {args: [--instance, inst_7f3a9c21, --json]} => the complete parsed object', () => {
      const result = snapshotsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--json'],
      });

      expect(result).toStrictEqual({ instanceId: 'inst_7f3a9c21' });
    });

    it('VALID: {args: [--instance, inst_9b2c4d1e]} => --json is optional', () => {
      const result = snapshotsArgsParseTransformer({ args: ['--instance', 'inst_9b2c4d1e'] });

      expect(result).toStrictEqual({ instanceId: 'inst_9b2c4d1e' });
    });
  });

  describe('the required flag missing entirely', () => {
    it('EMPTY: {args: []} => throws naming --instance as required and saying why there is no fleet form', () => {
      expect(() => snapshotsArgsParseTransformer({ args: [] })).toThrow(
        /^--instance is required: snapshots are held inside one instance's own throwaway home, so there is no fleet-wide form\.\n\nUsage: dungeonmaster siegelense snapshots --instance <instanceId> \[--json\]$/u,
      );
    });

    it('EMPTY: {args: [--instance, --json]} => throws naming --instance, not the flag that followed it', () => {
      expect(() => snapshotsArgsParseTransformer({ args: ['--instance', '--json'] })).toThrow(
        /^--instance is required/u,
      );
    });
  });

  describe('a badly-shaped --instance', () => {
    it("INVALID: {args: [--instance, not-a-valid-id]} => throws naming --instance and the contract's own message", () => {
      expect(() =>
        snapshotsArgsParseTransformer({ args: ['--instance', 'not-a-valid-id'] }),
      ).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('--human, which this call has no renderer for', () => {
    it('INVALID: {args: [--instance, inst_7f3a9c21, --human]} => refuses by name rather than silently answering JSON', () => {
      expect(() =>
        snapshotsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--human'] }),
      ).toThrow(
        /^--human is not implemented for snapshots: it answers JSON only\. A snapshot list is a handful of names and times — read it as JSON rather than being handed a table this call has no renderer for\.\n\nUsage: dungeonmaster siegelense snapshots --instance <instanceId> \[--json\]$/u,
      );
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
