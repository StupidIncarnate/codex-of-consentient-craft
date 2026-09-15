import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';

import { runExecuteStepLayerBroker } from './run-execute-step-layer-broker';
import { runExecuteStepLayerBrokerProxy } from './run-execute-step-layer-broker.proxy';

const FIXED_NOW_MS = 1_700_000_000_000;

describe('runExecuteStepLayerBroker', () => {
  describe('a step that succeeds, expecting ok', () => {
    it('VALID: {goto succeeds} => returns an ok reading and no stoppedAt', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoSucceeds();
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/guilds' }) });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 1,
          verb: 'goto',
          node: null,
          ok: true,
          expected: 'ok',
          reading: '/guilds',
          shot: null,
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: null,
      });
    });
  });

  describe('a step that unexpectedly throws', () => {
    it('ERROR: {goto rejects, expect ok} => an ok:false reading and a stoppedAt naming the step and verb', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoRejects({
        error: new Error('page.goto: Timeout 30000ms exceeded.'),
      });
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/guilds' }) });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 3 }),
        shotPath: null,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 3,
          verb: 'goto',
          node: null,
          ok: false,
          expected: 'ok',
          reading: 'page.goto: Timeout 30000ms exceeded.',
          shot: null,
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: 'page.goto: Timeout 30000ms exceeded.',
          candidates: [],
        },
      });
    });
  });

  describe('an expect: error step that throws as intended', () => {
    it('VALID: {goto rejects, expect error} => an ok:true reading and no stoppedAt', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoRejects({ error: new Error('boom') });
      const step = StepStub({
        step: 'goto',
        path: UrlPathStub({ value: '/guilds' }),
        expect: 'error',
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 2 }),
        shotPath: null,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 2,
          verb: 'goto',
          node: null,
          ok: true,
          expected: 'error',
          reading: 'boom',
          shot: null,
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: null,
      });
    });
  });

  describe('an expect: error step that succeeds instead', () => {
    it('INVALID: {goto succeeds, expect error} => ok:false and a stoppedAt reporting the finding', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoSucceeds();
      const step = StepStub({
        step: 'goto',
        path: UrlPathStub({ value: '/guilds' }),
        expect: 'error',
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 4 }),
        shotPath: null,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 4,
          verb: 'goto',
          node: null,
          ok: false,
          expected: 'error',
          reading: '/guilds',
          shot: null,
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 4,
          verb: 'goto',
          error: "step 4 (goto) declared expect: 'error' but succeeded: /guilds",
          candidates: [],
        },
      });
    });
  });
});
