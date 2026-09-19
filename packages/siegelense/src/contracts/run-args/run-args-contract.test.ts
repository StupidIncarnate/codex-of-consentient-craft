import { runArgsContract } from './run-args-contract';
import { RunArgsStub } from './run-args.stub';

describe('runArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId, one step, stopOn, json: false} => parses the complete args', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        json: false,
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        json: false,
      });
    });

    it('VALID: {json: true} => parses args with json true', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
        json: true,
      });

      expect(result.json).toBe(true);
    });

    it('VALID: {stopOn: never} => an adversarial batch that pushes through every step parses', () => {
      const result = runArgsContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'eval', source: 'document.title', node: null, expect: 'ok' }],
        stopOn: 'never',
        json: false,
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
        json: false,
      });

      expect(result.steps).toStrictEqual([]);
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing stopOn} => raises exactly one issue, scoped to stopOn', () => {
      const result = runArgsContract.safeParse({
        instanceId: 'inst_7f3a9c21',
        steps: [],
        json: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: "'error' | 'never'",
          received: 'undefined',
          path: ['stopOn'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {missing instanceId} => raises exactly one issue, scoped to instanceId', () => {
      const result = runArgsContract.safeParse({
        steps: [],
        stopOn: 'error',
        json: false,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['instanceId'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {missing json} => raises exactly one issue, scoped to json', () => {
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
          received: 'undefined',
          path: ['json'],
          message: 'Required',
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
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'runId'/u);
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
        json: false,
      });
    });
  });
});
