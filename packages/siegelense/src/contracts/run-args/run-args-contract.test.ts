import { runArgsContract } from './run-args-contract';
import { RunArgsStub } from './run-args.stub';

describe('runArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId, one step, stopOn, isJson: false} => parses the complete args', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        isJson: false,
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        isJson: false,
      });
    });

    it('VALID: {isJson: true} => parses args with isJson true', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        isJson: true,
      });

      expect(result.isJson).toBe(true);
    });

    it('VALID: {stopOn: never} => an adversarial batch that pushes through every step parses', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'eval', source: 'document.title', node: null, expect: 'ok' }],
        stopOn: 'never',
        isJson: false,
      });

      expect(result.stopOn).toBe('never');
    });
  });

  describe('empty collections', () => {
    it('EMPTY: {steps: []} => args with no steps still parses', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [],
        stopOn: 'error',
        isJson: false,
      });

      expect(result.steps).toStrictEqual([]);
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing stopOn} => raises exactly one issue, scoped to stopOn', () => {
      const result = runArgsContract.safeParse({
        instanceId: 'inst_7f3a9c21',
        steps: [],
        isJson: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_value',
          values: ['error', 'never'],
          path: ['stopOn'],
          message: 'Invalid option: expected one of "error"|"never"',
        },
      ]);
    });

    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId', () => {
      const result = runArgsContract.safeParse({
        steps: [],
        stopOn: 'error',
        isJson: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['instanceId'],
          message: 'Invalid input: expected string, received undefined',
        },
      ]);
    });

    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = runArgsContract.safeParse({
        instanceId: 'inst_7f3a9c21',
        steps: [],
        stopOn: 'error',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          path: ['isJson'],
          message: 'Invalid input: expected boolean, received undefined',
        },
      ]);
    });

    it('INVALID: {stray key} => throws naming the unrecognized key', () => {
      expect(() =>
        runArgsContract.parse({
          instanceId: 'inst_7f3a9c21',
          steps: [],
          stopOn: 'error',
          runId: 'run_2',
        }),
      ).toThrow(/"message": "Unrecognized key: \\"runId\\""/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates args with one click step', () => {
      const result = RunArgsStub();

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [
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
        isJson: false,
      });
    });
  });
});
