import { statusArgsParseTransformer } from './status-args-parse-transformer';

describe('statusArgsParseTransformer', () => {
  describe('the full flag set', () => {
    it('VALID: {args: [--instance, inst_7f3a9c21, --branch, main, --since, 1hr, --json]} => explicit --json sets isJson: true', () => {
      const result = statusArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--branch', 'main', '--since', '1hr', '--json'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        branch: 'main',
        since: '1h',
        isJson: true,
      });
    });
  });

  describe('no args', () => {
    it('EMPTY: {args: []} => the bare fleet-table default with isJson: false', () => {
      const result = statusArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '6h',
        isJson: false,
      });
    });
  });

  describe('--human flag', () => {
    it('INVALID: {args: [--human]} => --human is refused as an unknown flag', () => {
      expect(() => statusArgsParseTransformer({ args: ['--human'] })).toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --instance, --branch, --since, --json\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--branch <name>\] \[--since <1hr\|6hr\|1day\|beginning>\] \[--json\]$/u,
      );
    });
  });

  describe('--json flag', () => {
    it('VALID: {args: [--json]} => explicit --json sets isJson: true', () => {
      const result = statusArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '6h',
        isJson: true,
      });
    });

    it('VALID: {args: [--instance, inst_7f3a9c21, --json]} => parses instanceId with isJson: true', () => {
      const result = statusArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--json'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        branch: null,
        since: null,
        isJson: true,
      });
    });
  });

  describe('--instance with no value', () => {
    it('INVALID: {args: [--instance]} => throws naming the flag as required', () => {
      expect(() => statusArgsParseTransformer({ args: ['--instance'] })).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });

  describe('a badly-shaped --instance', () => {
    it("INVALID: {args: [--instance, not-a-valid-id]} => throws naming --instance and the contract's own message", () => {
      expect(() => statusArgsParseTransformer({ args: ['--instance', 'not-a-valid-id'] })).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('--branch flag', () => {
    it('VALID: {args: [--branch, main]} => parses branch with isJson: false', () => {
      const result = statusArgsParseTransformer({ args: ['--branch', 'main'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: 'main',
        since: '6h',
        isJson: false,
      });
    });
  });

  describe('--since flag', () => {
    it('VALID: {args: [--since, 1hr]} => parses 1hr into 1h', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '1hr'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '1h',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, 1h]} => parses 1h into 1h', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '1h'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '1h',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, 6hr]} => parses 6hr into 6h', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '6hr'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '6h',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, 6h]} => parses 6h into 6h', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '6h'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '6h',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, 1day]} => parses 1day into 1d', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '1day'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '1d',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, 1d]} => parses 1d into 1d', () => {
      const result = statusArgsParseTransformer({ args: ['--since', '1d'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: '1d',
        isJson: false,
      });
    });

    it('VALID: {args: [--since, beginning]} => parses beginning into beginning', () => {
      const result = statusArgsParseTransformer({ args: ['--since', 'beginning'] });

      expect(result).toStrictEqual({
        instanceId: null,
        branch: null,
        since: 'beginning',
        isJson: false,
      });
    });

    it('INVALID: {args: [--since, 30m]} => refuses granular intervals naming the coarse windows', () => {
      expect(() => statusArgsParseTransformer({ args: ['--since', '30m'] })).toThrow(
        /^--since: Only coarse-grained time windows are allowed \(1hr, 6hr, 1day, beginning\)\. Granular intervals are refused to prevent granular abuse\.$/u,
      );
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {args: [--bogus]} => throws naming the flag and listing the accepted ones', () => {
      expect(() => statusArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --branch, --since, --json\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--branch <name>\] \[--since <1hr\|6hr\|1day\|beginning>\] \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {args: [extra]} => throws naming it', () => {
      expect(() => statusArgsParseTransformer({ args: ['extra'] })).toThrow(
        /^Unexpected positional argument: extra\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense status \[--instance <instanceId>\] \[--branch <name>\] \[--since <1hr\|6hr\|1day\|beginning>\] \[--json\]$/u,
      );
    });
  });
});
