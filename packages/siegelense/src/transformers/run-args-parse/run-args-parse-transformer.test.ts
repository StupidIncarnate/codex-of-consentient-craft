import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { runArgsParseTransformer } from './run-args-parse-transformer';

describe('runArgsParseTransformer', () => {
  describe('valid args', () => {
    it('VALID: {--steps with a two-step array} => the parsed steps and stopOn error', () => {
      const stepsJson = JSON.stringify([
        { step: 'goto', path: '/' },
        { step: 'click', target: '[data-testid="GUILD_ADD"]' },
      ]);

      const result = runArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--steps', stepsJson],
        stepsFileContent: null,
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [
          { step: 'goto', path: '/', node: null, expect: 'ok' },
          {
            step: 'click',
            target: '[data-testid="GUILD_ADD"]',
            within: null,
            ref: null,
            timeoutMs: null,
            node: null,
            expect: 'ok',
          },
        ],
        stopOn: 'error',
      });
    });

    it('VALID: {--steps-file with its content already resolved by the caller} => the same parsed steps', () => {
      const stepsJson = JSON.stringify([{ step: 'goto', path: '/' }]);

      const result = runArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--steps-file', '/tmp/wherever/steps.json'],
        stepsFileContent: ContentTextStub({ value: stepsJson }),
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        stopOn: 'error',
      });
    });

    it('VALID: {--stop-on never} => stopOn never', () => {
      const stepsJson = JSON.stringify([{ step: 'goto', path: '/' }]);

      const result = runArgsParseTransformer({
        args: ['--instance', 'inst_7f3a9c21', '--steps', stepsJson, '--stop-on', 'never'],
        stepsFileContent: null,
      });

      expect(result.stopOn).toBe('never');
    });
  });

  describe('the steps source refusal', () => {
    it('INVALID: {neither --steps nor --steps-file} => throws naming both flags', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^Exactly one of --steps or --steps-file is required: --steps carries the batch's JSON array inline, --steps-file names a file holding it, and neither was given\.$/u,
      );
    });

    it('INVALID: {both --steps and --steps-file} => throws naming both flags', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--steps', '[]', '--steps-file', '/tmp/x.json'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^Exactly one of --steps or --steps-file is required: --steps carries the batch's JSON array inline, --steps-file names a file holding it, and both were given\.$/u,
      );
    });

    it('EDGE: {--steps-file given but stepsFileContent never resolved} => throws naming the wiring gap', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--steps-file', '/tmp/x.json'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^--steps-file was given but its file content was never resolved: the caller must read that file before calling this transformer\.$/u,
      );
    });
  });

  describe('malformed JSON', () => {
    it("INVALID: {--steps '[{'} => throws carrying JSON.parse's own message", () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--steps', '[{'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^--steps's value is not valid JSON: Expected property name or '\}' in JSON at position 2 \(line 1 column 3\)$/u,
      );
    });
  });

  describe('rejecting a step that fails stepContract', () => {
    it('INVALID: {a step with an unknown key} => throws naming --steps, the path and the message, never the raw issue array', () => {
      expect(() =>
        runArgsParseTransformer({
          args: [
            '--instance',
            'inst_7f3a9c21',
            '--steps',
            JSON.stringify([{ step: 'goto', path: '/', bogus: true }]),
          ],
          stepsFileContent: null,
        }),
      ).toThrow(/^--steps: steps\.0: Unrecognized key\(s\) in object: 'bogus'$/u);
    });
  });

  describe('an --instance value that fails instanceIdContract', () => {
    it("INVALID: {--instance not-a-valid-id} => throws naming --instance and the contract's own message", () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'not-a-valid-id', '--steps', '[]'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^--instance: Instance id must look like "inst_" followed by 4 or more lowercase hex characters, e\.g\. "inst_7f3a9c21"$/u,
      );
    });
  });

  describe('a --stop-on value that fails stopOnContract', () => {
    it("INVALID: {--stop-on maybe} => throws naming --stop-on and the contract's own message", () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', 'inst_7f3a9c21', '--steps', '[]', '--stop-on', 'maybe'],
          stepsFileContent: null,
        }),
      ).toThrow(/^--stop-on: Invalid enum value\. Expected 'error' \| 'never', received 'maybe'$/u);
    });
  });

  describe('two steps that each fail stepContract', () => {
    it('INVALID: {two steps, each with a different unknown key} => throws naming --steps and BOTH issues, joined by "; "', () => {
      expect(() =>
        runArgsParseTransformer({
          args: [
            '--instance',
            'inst_7f3a9c21',
            '--steps',
            JSON.stringify([
              { step: 'goto', path: '/', bogus: true },
              { step: 'goto', path: '/', evil: true },
            ]),
          ],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^--steps: steps\.0: Unrecognized key\(s\) in object: 'bogus'; steps\.1: Unrecognized key\(s\) in object: 'evil'$/u,
      );
    });
  });

  describe('required flags', () => {
    it('INVALID: {missing --instance} => throws naming --instance', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--steps', '[]'],
          stepsFileContent: null,
        }),
      ).toThrow(/^--instance is required: name the instance this batch runs against\.$/u);
    });
  });

  describe('unrecognised argv', () => {
    it('INVALID: {unknown flag} => throws naming it and listing the accepted flags', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--bogus', 'x'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^Unknown flag: --bogus\n\nAccepted flags: --instance, --steps, --steps-file, --stop-on, --json\n\nUsage: dungeonmaster siegelense run --instance <instanceId> \(--steps <json> \| --steps-file <path>\) \[--stop-on error\|never\] \[--json\]$/u,
      );
    });

    it('INVALID: {positional argument} => throws naming it', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['stray'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^Unexpected positional argument: stray\n\nEvery value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense run --instance <instanceId> \(--steps <json> \| --steps-file <path>\) \[--stop-on error\|never\] \[--json\]$/u,
      );
    });
  });

  describe('a value-flag immediately followed by another known flag', () => {
    it('INVALID: {--instance --steps []} => throws naming --instance as the flag whose value is missing', () => {
      expect(() =>
        runArgsParseTransformer({
          args: ['--instance', '--steps', '[]'],
          stepsFileContent: null,
        }),
      ).toThrow(
        /^--instance is required: it cannot be missing, and the value cannot itself start with "--"\.$/u,
      );
    });
  });
});
