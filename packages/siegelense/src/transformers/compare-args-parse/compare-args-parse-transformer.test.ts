import { compareArgsParseTransformer } from './compare-args-parse-transformer';

describe('compareArgsParseTransformer', () => {
  describe('every flag named', () => {
    it('VALID: {--instance, --run-a, --run-b} => returns the complete object', () => {
      const result = compareArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'run_5'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });
    });
  });

  describe('--json is accepted as an explicit affirmation of the default', () => {
    it('VALID: {--instance, --run-a, --run-b, --json} => the same object --json contributes no field to', () => {
      const result = compareArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'run_5', '--json'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });
    });
  });

  describe('the cross-instance refusal', () => {
    it('INVALID: {--instance-a X --instance-b Y} => throws naming both flags and stating there is no cross-instance form', () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance-a', 'inst_7f3a9c21', '--instance-b', 'inst_9b2c1234'],
        }),
      ).toThrow(
        /^--instance-a and --instance-b are not accepted: there is no cross-instance form\. Name one --instance and two runs \(--run-a, --run-b\) inside its own timeline — two different instances share nothing but a spec\.$/u,
      );
    });
  });

  describe('--run-a without --run-b', () => {
    it('INVALID: {--instance, --run-a, no --run-b} => throws naming --run-b as required', () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4'],
        }),
      ).toThrow(/^--run-b is required: name the later run in the diff\.$/u);
    });
  });

  describe('missing --instance', () => {
    it('INVALID: {--run-a and --run-b but no --instance} => throws naming --instance as required', () => {
      expect(() =>
        compareArgsParseTransformer({ args: ['--run-a', 'run_4', '--run-b', 'run_5'] }),
      ).toThrow(/^--instance is required: name the instance both runs belong to\.$/u);
    });
  });

  describe('unknown flag', () => {
    it('INVALID: {--bogus X} => throws naming the flag and listing the accepted ones', () => {
      expect(() => compareArgsParseTransformer({ args: ['--bogus', 'X'] })).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --run-a, --run-b, --json\n\nUsage: dungeonmaster siegelense compare --instance <instanceId> --run-a <runId> --run-b <runId> \[--json\]$/u,
      );
    });
  });

  describe('positional argument', () => {
    it('INVALID: {a bare token} => throws naming it', () => {
      expect(() => compareArgsParseTransformer({ args: ['inst_7f3a9c21'] })).toThrow(
        /^Unexpected positional argument: inst_7f3a9c21\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense compare --instance <instanceId> --run-a <runId> --run-b <runId> \[--json\]$/u,
      );
    });
  });

  describe('a badly-shaped --instance', () => {
    it("INVALID: {--instance not-a-valid-id} => throws naming --instance and the contract's own message", () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance', 'not-a-valid-id', '--run-a', 'run_4', '--run-b', 'run_5'],
        }),
      ).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('a badly-shaped --run-a', () => {
    it("INVALID: {--run-a bogus} => throws naming --run-a and runIdContract's own message", () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--run-a', 'bogus', '--run-b', 'run_5'],
        }),
      ).toThrow(/^--run-a: Invalid$/u);
    });
  });

  describe('a badly-shaped --run-b', () => {
    it("INVALID: {--run-b bogus} => throws naming --run-b and runIdContract's own message", () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'bogus'],
        }),
      ).toThrow(/^--run-b: Invalid$/u);
    });
  });

  describe('a value-flag immediately followed by another known flag', () => {
    it('INVALID: {--run-a --run-b run_5} => throws naming --run-a as the flag whose value is missing', () => {
      expect(() =>
        compareArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--run-a', '--run-b', 'run_5'],
        }),
      ).toThrow(
        /^--run-a is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });
});
