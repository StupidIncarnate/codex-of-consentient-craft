import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FileNameStub,
} from '@dungeonmaster/shared/contracts';

import { LocatorStateStub } from '../../../contracts/locator-state/locator-state.stub';
import { NodeLabelStub } from '../../../contracts/node-label/node-label.stub';
import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';

import { stepDispatchBroker } from './step-dispatch-broker';
import { stepDispatchBrokerProxy } from './step-dispatch-broker.proxy';

const FIXED_NOW_MS = 1_700_000_000_000;

describe('stepDispatchBroker', () => {
  describe('a targeting step against one match', () => {
    it('VALID: {click on a single match} => returns a reading with ok true and the shot path', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const foregroundPixel = [255, 255, 255, 255];
      const pixelRows = Array.from({ length: 8 }, () => backgroundPixel);
      pixelRows[7] = foregroundPixel;
      proxy.stagesShotFrame({
        shotPath,
        width: 4,
        height: 2,
        pixels: new Uint8Array(pixelRows.flat()),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: false,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
      expect(captureCallArgs()).toStrictEqual([
        [{ filePath: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png' }],
      ]);
    });
  });

  describe('a click whose capture is blank', () => {
    it('VALID: {a fully #0d0907 frame} => the reading carries blank true and the app background colour', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: true,
        blankColour: '#0d0907',
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
    });
  });

  describe('the first capture in the instance', () => {
    it('VALID: {no previous shot} => pixelChange is null', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.pixelChange).toBe(null);
    });
  });

  describe('a second capture', () => {
    it('VALID: {2 of 100 pixels differ from the first capture} => pixelChange is the measured percent AND lastShotPath advanced to this shot', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const firstShotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const secondShotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step2.png',
      });
      const whitePixels = new Uint8Array(400).fill(255);
      const blackPixels = new Uint8Array(400).fill(255);
      const flatPixelStride = 4;
      const firstDifferingPixel = 0;
      const secondDifferingPixel = 50;
      blackPixels[firstDifferingPixel * flatPixelStride] = 0;
      blackPixels[firstDifferingPixel * flatPixelStride + 1] = 0;
      blackPixels[firstDifferingPixel * flatPixelStride + 2] = 0;
      blackPixels[secondDifferingPixel * flatPixelStride] = 0;
      blackPixels[secondDifferingPixel * flatPixelStride + 1] = 0;
      blackPixels[secondDifferingPixel * flatPixelStride + 2] = 0;
      proxy.stagesShotFrame({
        shotPath: firstShotPath,
        width: 10,
        height: 10,
        pixels: whitePixels,
      });
      proxy.stagesShotFrame({
        shotPath: secondShotPath,
        width: 10,
        height: 10,
        pixels: blackPixels,
      });

      await stepDispatchBroker({
        lane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 1 }),
        shotPath: firstShotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      const result = await stepDispatchBroker({
        lane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 2 }),
        shotPath: secondShotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.pixelChange).toBe('2%');
      expect(proxy.lastShotPath()).toBe(secondShotPath);
    });
  });

  describe('a step with expect: error that failed', () => {
    it('VALID: {click throws as the declared attack} => still carries a measured blank and pixelChange', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.laneRejectingClickMatch({ error: new Error('boom') });
      const step = StepStub({ step: 'click', target: SelectorStub(), expect: 'error' });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'error',
        reading: 'boom',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: true,
        blankColour: '#0d0907',
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
      expect(proxy.lastShotPath()).toBe(shotPath);
    });
  });

  describe('a waitFor with no shot', () => {
    it('EDGE: {shotPath: null} => pixelChange, blank and blankColour are all null and lastShotPath is unchanged', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'waitFor',
        target: SelectorStub(),
        state: LocatorStateStub({ value: 'visible' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect({
        pixelChange: result.pixelChange,
        blank: result.blank,
        blankColour: result.blankColour,
        lastShotPath: proxy.lastShotPath(),
      }).toStrictEqual({
        pixelChange: null,
        blank: null,
        blankColour: null,
        lastShotPath: null,
      });
    });
  });

  describe('serverWindow reads the log length before and after the verb runs', () => {
    it('VALID: {serverLogLength grows from 120 to 450 across the verb} => serverWindow reports the real before/after pair', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLaneWithServerLogWindow({
        serverLogLengthSequence: [120, 450],
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.serverWindow).toStrictEqual({ fromByte: 120, toByte: 450 });
    });
  });

  describe('a browser step against a browserless lane', () => {
    it('INVALID: {click against dungeonmaster-headless} => throws BrowserStepUnsupportedError naming the spec', async () => {
      const proxy = stepDispatchBrokerProxy();
      const lane = proxy.browserlessLane({ specName: 'dungeonmaster-headless' });
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message:
          'Step click needs a browser, but spec dungeonmaster-headless declares browser: false',
      });
    });

    it('VALID: {eval against a lane whose browser is present} => the guard does not fire, so the step still works', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'eval',
        source: ContentTextStub({ value: '() => document.title' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('expect: error inversion', () => {
    it('VALID: {expect: error, step throws} => returns ok true', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.laneRejectingClickMatch({ error: new Error('boom') });
      const step = StepStub({ step: 'click', target: SelectorStub(), expect: 'error' });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
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
      });
    });

    it('INVALID: {expect: error, step succeeds} => returns ok false', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub(), expect: 'error' });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: false,
        expected: 'error',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
    });

    it('VALID: {expect: error, waitFor hits its ceiling} => the ceiling hit is inverted into ok true, not a throw', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.laneRejectingWaitForMatch({
        error: new Error('Timeout 30000ms exceeded'),
      });
      const step = StepStub({
        step: 'waitFor',
        target: SelectorStub(),
        state: LocatorStateStub({ value: 'visible' }),
        expect: 'error',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'waitFor',
        node: null,
        ok: true,
        expected: 'error',
        reading:
          'visible [data-testid="GUILD_ADD"] never resolved in 30000ms: Error: Timeout 30000ms exceeded',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
    });

    it('INVALID: {expect: error, waitFor resolves} => the resolved state is reported as a finding, ok false', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'waitFor',
        target: SelectorStub(),
        state: LocatorStateStub({ value: 'visible' }),
        expect: 'error',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'waitFor',
        node: null,
        ok: false,
        expected: 'error',
        reading: '[data-testid="GUILD_ADD"] reached state "visible"',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
    });
  });

  describe('a real failure, not the declared expect: error attack', () => {
    it('ERROR: {click throws for a real reason, shotPath non-null} => captures the failure screenshot before rethrowing', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('AMBIGUOUS: 2 elements match [data-testid="X"]');
      expect(captureCallArgs()).toStrictEqual([
        [{ filePath: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png' }],
      ]);
    });

    it('VALID: {eval, shotPath: null} => a non-acting step throwing for real never calls capture', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.laneRejectingClickMatch({
        error: new Error('boom'),
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('boom');
      expect(captureCallArgs()).toStrictEqual([]);
    });

    it('ERROR: {click throws, the failure capture itself also throws} => the original click error still propagates, not the capture error', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.laneRejectingClickMatchAndCapture({
        clickError: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
        captureError: new Error('ENOSPC: no space left on device'),
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('AMBIGUOUS: 2 elements match [data-testid="X"]');
      expect(captureCallArgs()).toStrictEqual([
        [{ filePath: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png' }],
      ]);
    });
  });

  describe('a node label', () => {
    it('VALID: {node label} => the reading carries it', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'click',
        target: SelectorStub(),
        node: NodeLabelStub({ value: 'open-guild-modal' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.node).toBe('open-guild-modal');
    });
  });

  describe('a non-acting step', () => {
    it('VALID: {eval, shotPath: null} => shot is null', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'eval',
        source: ContentTextStub({ value: '() => document.title' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.shot).toBe(null);
    });
  });

  describe('an ambiguous target', () => {
    it('INVALID: {two matches} => throws StepAmbiguousError uncaught and never calls clickMatch', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, clickMatchCallArgs } = proxy.laneWithTwoMatches();
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.name).toBe('StepAmbiguousError');
      expect(clickMatchCallArgs()).toStrictEqual([]);
    });
  });

  describe('routes each verb to its own broker', () => {
    it('VALID: {goto} => the reading is the resolved path', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({ step: 'goto', path: UrlPathStub({ value: '/api/guilds' }) });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.reading).toBe('/api/guilds');
    });

    it('VALID: {waitFor} => the reading names the target and the resolved state', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'waitFor',
        target: SelectorStub(),
        state: LocatorStateStub({ value: 'visible' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.reading).toBe('[data-testid="GUILD_ADD"] reached state "visible"');
    });

    it('VALID: {type} => the reading names the typed value and the target', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'type',
        target: SelectorStub(),
        value: ContentTextStub({ value: 'siege-1' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.reading).toBe('typed "siege-1" into [data-testid="GUILD_ADD"]');
    });

    it('VALID: {screenshot} => the reading is the shot path, captured exactly once', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'screenshot', name: FileNameStub({ value: 'step1.png' }) });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.reading).toBe(
        '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      );
      expect(captureCallArgs()).toStrictEqual([
        [{ filePath: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png' }],
      ]);
    });

    it('VALID: {eval} => the reading is the stringified evaluated value', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({
        step: 'eval',
        source: ContentTextStub({ value: '() => document.title' }),
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      expect(result.reading).toBe('"Guild Hall"');
    });
  });
});
