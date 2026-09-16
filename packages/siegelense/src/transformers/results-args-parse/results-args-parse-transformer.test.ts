import { resultsStatics } from '../../statics/results/results-statics';
import { resultsArgsParseTransformer } from './results-args-parse-transformer';

describe('resultsArgsParseTransformer', () => {
  describe('--instance only', () => {
    it('VALID: {--instance inst_7f3a9c21} => every other member null', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: null,
      });
    });
  });

  describe('--run and --step together', () => {
    it('VALID: {--run run_2 --step 7} => that run and that step', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--run', 'run_2', '--step', '7'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        step: 7,
        kind: null,
        where: null,
        fields: null,
        since: null,
      });
    });
  });

  describe('--kind with two of the five --where-* flags', () => {
    it('VALID: {--kind network --where-path /api/quests --where-method POST} => where carries exactly those two, the other three null', () => {
      const result = resultsArgsParseTransformer({
        args: [
          '--instance',
          'inst_7f3a9c21',
          '--kind',
          'network',
          '--where-path',
          '/api/quests',
          '--where-method',
          'POST',
        ],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: 'network',
        where: { path: '/api/quests', method: 'POST', nth: null, level: null, steps: null },
        fields: null,
        since: null,
      });
    });
  });

  describe('--fields as one comma-separated value', () => {
    it('VALID: {--fields status,responseBody} => the two-member array', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--fields', 'status,responseBody'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: ['status', 'responseBody'],
        since: null,
      });
    });
  });

  describe('--since boot', () => {
    it('VALID: {--since boot} => since "boot", runId null', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--since', 'boot'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: 'boot',
      });
    });
  });

  describe('--json is accepted as an explicit affirmation of the default', () => {
    it('VALID: {--instance inst_7f3a9c21 --json} => the same object --json contributes no field to', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--json'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: null,
        fields: null,
        since: null,
      });
    });
  });

  describe('an unrecognised --kind value', () => {
    it('INVALID: {--kind bogus} => throws naming the value and listing the six kinds', () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--kind', 'bogus'],
        }),
      ).toThrow(
        new RegExp(
          `^--kind must be one of: ${resultsStatics.kinds.all.join(', ')}\\. Received: "bogus"\\.$`,
          'u',
        ),
      );
    });
  });

  describe('a reversed --where-steps range', () => {
    it('VALID: {--where-steps 9-4} => stepRangeContract accepts it unordered, so where.steps is "9-4"', () => {
      const result = resultsArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--where-steps', '9-4'],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: null,
        step: null,
        kind: null,
        where: { path: null, method: null, nth: null, level: null, steps: '9-4' },
        fields: null,
        since: null,
      });
    });
  });

  describe('an empty member inside --fields', () => {
    it('INVALID: {--fields status,} => throws naming the empty member', () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--fields', 'status,'],
        }),
      ).toThrow(
        /^--fields has an empty member: "status," splits on "," into an empty token\. Each entry between commas must be a non-empty field name\.$/u,
      );
    });
  });

  describe('a badly-shaped --instance', () => {
    it("INVALID: {--instance not-a-valid-id} => throws naming --instance and the contract's own message", () => {
      expect(() => resultsArgsParseTransformer({ args: ['--instance', 'not-a-valid-id'] })).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('a badly-shaped --run', () => {
    it("INVALID: {--run bogus} => throws naming --run and runIdContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--run', 'bogus'] }),
      ).toThrow(/^--run: Invalid$/u);
    });
  });

  describe('a non-numeric --step', () => {
    it("INVALID: {--step abc} => throws naming --step and stepIndexContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--step', 'abc'] }),
      ).toThrow(/^--step: Expected number, received nan$/u);
    });
  });

  describe('a badly-shaped --where-method', () => {
    it("INVALID: {--where-method WOOF} => throws naming --where-method and httpMethodContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--where-method', 'WOOF'],
        }),
      ).toThrow(
        /^--where-method: Invalid enum value\. Expected 'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE' \| 'HEAD' \| 'OPTIONS', received 'WOOF'$/u,
      );
    });
  });

  describe('a negative --where-nth', () => {
    it("INVALID: {--where-nth -1} => throws naming --where-nth and arrayIndexContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--where-nth', '-1'],
        }),
      ).toThrow(/^--where-nth: Number must be greater than or equal to 0$/u);
    });
  });

  describe('a badly-shaped --where-level', () => {
    it("INVALID: {--where-level fatal} => throws naming --where-level and logLevelContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--where-level', 'fatal'],
        }),
      ).toThrow(
        /^--where-level: Invalid enum value\. Expected 'error' \| 'warn' \| 'info', received 'fatal'$/u,
      );
    });
  });

  describe('a badly-shaped --where-steps', () => {
    it("INVALID: {--where-steps abc} => throws naming --where-steps and stepRangeContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--where-steps', 'abc'],
        }),
      ).toThrow(/^--where-steps: Invalid$/u);
    });
  });

  describe('a badly-shaped --since', () => {
    it("INVALID: {--since now} => throws naming --since and sinceMarkerContract's own message", () => {
      expect(() =>
        resultsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--since', 'now'] }),
      ).toThrow(/^--since: Invalid literal value, expected "boot"$/u);
    });
  });

  describe('an unknown flag', () => {
    it('INVALID: {--bogus X} => throws naming the flag and listing the accepted ones', () => {
      expect(() =>
        resultsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--bogus', 'X'] }),
      ).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --run, --step, --kind, --since, --where-path, --where-method, --where-nth, --where-level, --where-steps, --fields, --json\n\nUsage: dungeonmaster siegelense results --instance <instanceId> \[--run <runId>\] \[--step <n>\] \[--kind <kind>\] \[--where-path <p>\] \[--where-method <method>\] \[--where-nth <n>\] \[--where-level <level>\] \[--where-steps <a-b>\] \[--fields <a,b,c>\] \[--since boot\] \[--json\]$/u,
      );
    });
  });

  describe('a positional argument', () => {
    it('INVALID: {a bare token} => throws naming it', () => {
      expect(() => resultsArgsParseTransformer({ args: ['inst_7f3a9c21'] })).toThrow(
        /^Unexpected positional argument: inst_7f3a9c21\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense results --instance <instanceId> \[--run <runId>\] \[--step <n>\] \[--kind <kind>\] \[--where-path <p>\] \[--where-method <method>\] \[--where-nth <n>\] \[--where-level <level>\] \[--where-steps <a-b>\] \[--fields <a,b,c>\] \[--since boot\] \[--json\]$/u,
      );
    });
  });

  describe('missing --instance', () => {
    it('INVALID: {no --instance} => throws naming --instance as required', () => {
      expect(() => resultsArgsParseTransformer({ args: ['--run', 'run_2'] })).toThrow(
        /^--instance is required: name the instance to read evidence from\.$/u,
      );
    });
  });

  describe('a value-flag immediately followed by another known flag', () => {
    it('INVALID: {--instance inst_7f3a9c21 --run --kind network} => throws naming --run as the flag whose value is missing', () => {
      expect(() =>
        resultsArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--run', '--kind', 'network'],
        }),
      ).toThrow(
        /^--run is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });
});
