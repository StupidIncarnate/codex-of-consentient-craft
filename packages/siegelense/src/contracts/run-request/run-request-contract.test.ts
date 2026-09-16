import { runRequestContract } from './run-request-contract';
import { RunRequestStub } from './run-request.stub';

describe('runRequestContract', () => {
  describe('valid requests', () => {
    it('VALID: {instanceId, one step, stopOn} => parses the complete request', () => {
      const result = runRequestContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/api/guilds', node: null, expect: 'ok' }],
        stopOn: 'error',
      });
    });

    it('VALID: {stopOn: never} => an adversarial batch that pushes through every step parses', () => {
      const result = runRequestContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'eval', source: 'document.title', node: null, expect: 'ok' }],
        stopOn: 'never',
      });

      expect(result.stopOn).toBe('never');
    });
  });

  describe('empty collections', () => {
    it('EMPTY: {steps: []} => a request with no steps still parses', () => {
      const result = runRequestContract.parse({
        instanceId: 'inst_7f3a9c21',
        steps: [],
        stopOn: 'error',
      });

      expect(result.steps).toStrictEqual([]);
    });
  });

  describe('invalid requests', () => {
    it('INVALID: {missing stopOn} => throws validation error', () => {
      expect(() =>
        runRequestContract.parse({
          instanceId: 'inst_7f3a9c21',
          steps: [],
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing instanceId} => throws validation error', () => {
      expect(() =>
        runRequestContract.parse({
          steps: [],
          stopOn: 'error',
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a request with one click step', () => {
      const result = RunRequestStub();

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [
          {
            step: 'click',
            target: '[data-testid="GUILD_ADD"]',
            within: null,
            timeoutMs: null,
            node: null,
            expect: 'ok',
          },
        ],
        stopOn: 'error',
      });
    });
  });
});
