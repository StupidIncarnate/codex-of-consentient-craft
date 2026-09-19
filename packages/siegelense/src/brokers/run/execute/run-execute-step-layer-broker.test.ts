import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';
import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { LocatorStateStub } from '../../../contracts/locator-state/locator-state.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';

import { runExecuteStepLayerBroker } from './run-execute-step-layer-broker';
import { runExecuteStepLayerBrokerProxy } from './run-execute-step-layer-broker.proxy';

const FIXED_NOW_MS = 1_700_000_000_000;

// Every case below drives a browser verb with no placeholder, so the binding store is empty and
// nothing is ever recorded. Interpolation and recording have their own coverage in
// step-interpolate-transformer.test.ts and run-execute-broker.test.ts.
const NO_BINDINGS = (): Record<PropertyKey, never> => ({});
const NOOP = (): void => undefined;

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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: null,
        timedOut: false,
      });
    });
  });

  describe('serverWindow reads the log length before and after the verb runs', () => {
    it('VALID: {goto rejects, serverLogLength grows across the call} => serverWindow reports the real before/after pair, not the middle read stepDispatchBroker took', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoRejectsWithServerLogWindow({
        error: new Error('page.goto: Timeout 30000ms exceeded.'),
        // Three reads happen in order: this broker's own pre-dispatch read (100), stepDispatchBroker's
        // own pre-verb read (250, never surfaced — the verb throws before it reads again), then this
        // broker's own post-rethrow read (999) once the error unwinds back here.
        serverLogLengthSequence: [100, 250, 999],
      });
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/guilds' }) });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 3 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
      });

      expect(outcome.reading.serverWindow).toStrictEqual({ fromByte: 100, toByte: 999 });
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: 'page.goto: Timeout 30000ms exceeded.',
          candidates: [],
        },
        timedOut: false,
      });
    });
  });

  describe('a real failure whose failure-path capture succeeds', () => {
    it('ERROR: {goto rejects for real, shotPath non-null, capture succeeds} => the reading carries the shot path, not null', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoRejects({
        error: new Error('page.goto: Timeout 30000ms exceeded.'),
      });
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/guilds' }) });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step3.png',
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 3 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 3,
          verb: 'goto',
          node: null,
          ok: false,
          expected: 'ok',
          reading: 'page.goto: Timeout 30000ms exceeded.',
          shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step3.png',
          pixelChange: null,
          blank: false,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: 'page.goto: Timeout 30000ms exceeded.',
          candidates: [],
        },
        timedOut: false,
      });
    });
  });

  describe('a real failure whose failure-path capture itself fails', () => {
    it('ERROR: {goto rejects for real, shotPath non-null, capture rejects} => the reading honestly reports shot: null, never a path naming a missing file', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneGotoRejectsAndCaptureFails({
        error: new Error('page.goto: Timeout 30000ms exceeded.'),
        captureError: new Error('ENOSPC: no space left on device'),
      });
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/guilds' }) });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step3.png',
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 3 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 3,
          verb: 'goto',
          error: 'page.goto: Timeout 30000ms exceeded.',
          candidates: [],
        },
        timedOut: false,
      });
    });
  });

  describe('a waitFor that hits its ceiling', () => {
    it('ERROR: {waitFor never resolves, expect ok} => an ok:false reading, a stoppedAt, and timedOut true', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const lane = proxy.laneWaitForHitsCeiling({
        error: new Error('Timeout 30000ms exceeded'),
      });
      const step = StepStub({
        step: 'waitFor',
        target: SelectorStub(),
        state: LocatorStateStub({ value: 'visible' }),
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 2 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 2,
          verb: 'waitFor',
          node: null,
          ok: false,
          expected: 'ok',
          reading:
            'visible [data-testid="GUILD_ADD"] never resolved in 30000ms: Error: Timeout 30000ms exceeded',
          shot: null,
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 2,
          verb: 'waitFor',
          error:
            'visible [data-testid="GUILD_ADD"] never resolved in 30000ms: Error: Timeout 30000ms exceeded',
          candidates: [],
        },
        timedOut: true,
      });
    });
  });

  describe('an until that hits its ceiling — R9 end to end', () => {
    it('ERROR: {until visible never resolves, expect ok} => an ok:false reading, a stoppedAt, and timedOut true', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      // `name`, not just the message: `stepUntilBroker` folds a rejection into a ceiling only when
      // it is Playwright's own TimeoutError, so a plainly-named Error staged here would be
      // rethrown instead and this test would grade the wrong path.
      const ceilingError = new Error('Timeout 30000ms exceeded');
      ceilingError.name = 'TimeoutError';
      const lane = proxy.laneUntilHitsCeiling({ error: ceilingError });
      const step = StepStub({
        step: 'until',
        visible: SelectorStub({ value: '[data-testid="SUBAGENT_CHAIN"]' }),
        timeoutMs: 20000,
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 5 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
      });

      expect(outcome).toStrictEqual({
        reading: {
          step: 5,
          verb: 'until',
          node: null,
          ok: false,
          expected: 'ok',
          reading: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
          shot: null,
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 5,
          verb: 'until',
          error: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
          candidates: [],
        },
        // This is R9: a hung `until` reports `timedOut: true`, which is what makes
        // `runExecuteBroker` return `status: 'timeout'` rather than `status: 'failed'`.
        timedOut: true,
      });
    });

    it('ERROR: {until visible matches two elements} => timedOut false, so the run answers failed and the message names both', async () => {
      const proxy = runExecuteStepLayerBrokerProxy();
      const ambiguityMessage =
        'strict mode violation: locator(\'[data-testid="PIXEL_BTN"]\') resolved to 2 elements';
      const lane = proxy.laneUntilHitsCeiling({ error: new Error(ambiguityMessage) });
      const step = StepStub({
        step: 'until',
        visible: SelectorStub({ value: '[data-testid="PIXEL_BTN"]' }),
        timeoutMs: 20000,
      });

      const outcome = await runExecuteStepLayerBroker({
        lane,
        step,
        index: StepIndexStub({ value: 5 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
      });

      // The other half of R9. A ceiling is the only thing that may answer `timeout`; an ambiguity
      // reaching this branch as `timedOut: true` would tell a walker to wait longer for an element
      // already on the screen twice, and would bury Playwright's own message naming both.
      expect({ timedOut: outcome.timedOut, reading: outcome.reading.reading }).toStrictEqual({
        timedOut: false,
        reading: ambiguityMessage,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: null,
        timedOut: false,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        bindings: NO_BINDINGS,
        recordBinding: NOOP,
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: FIXED_NOW_MS,
          endedAtMs: FIXED_NOW_MS,
        },
        stoppedAt: {
          step: 4,
          verb: 'goto',
          error: "step 4 (goto) declared expect: 'error' but succeeded: /guilds",
          candidates: [],
        },
        timedOut: false,
      });
    });
  });
});
