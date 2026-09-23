import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FileNameStub,
} from '@dungeonmaster/shared/contracts';

import { ElementDeltaStub } from '../../../contracts/element-delta/element-delta.stub';
import { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';
import { KeyRowStub } from '../../../contracts/key-row/key-row.stub';
import { LocatorStateStub } from '../../../contracts/locator-state/locator-state.stub';
import { NodeLabelStub } from '../../../contracts/node-label/node-label.stub';
import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';
import type { StepFailureCaptureError } from '../../../errors/step-failure-capture/step-failure-capture-error';
import { stepStatics } from '../../../statics/step/step-statics';

import { stepDispatchBroker } from './step-dispatch-broker';
import { stepDispatchBrokerProxy } from './step-dispatch-broker.proxy';

const FIXED_NOW_MS = 1_700_000_000_000;

// Every case below drives a browser verb; `recordBinding` only ever fires for `seed`, which has
// its own coverage in step-seed-broker.test.ts.
const NOOP = (): void => undefined;

describe('stepDispatchBroker', () => {
  describe('a targeting step against one match', () => {
    it('VALID: {click on a single match} => returns a reading with ok true and the shot path', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: false,
        blankColour: null,
        previousReading: KeyListingStub(),
        delta: ElementDeltaStub(),
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
      expect(captureCallArgs()).toStrictEqual([
        [
          {
            filePath:
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
          },
        ],
      ]);
    });
  });

  describe('a click whose capture is blank', () => {
    it('VALID: {a fully #0d0907 frame} => the reading carries blank true and the app background colour', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: true,
        blankColour: '#0d0907',
        previousReading: KeyListingStub(),
        delta: ElementDeltaStub(),
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
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.pixelChange).toBe(null);
    });
  });

  describe('a second capture', () => {
    it('VALID: {2 of 100 pixels differ from the first capture} => pixelChange is the measured percent AND lastShotPath advanced to this shot', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      const firstShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const secondShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step2.png',
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      const result = await stepDispatchBroker({
        lane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 2 }),
        shotPath: secondShotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'error',
        reading: 'boom',
        shot: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        pixelChange: null,
        blank: true,
        blankColour: '#0d0907',
        previousReading: KeyListingStub(),
        delta: ElementDeltaStub(),
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.serverWindow).toStrictEqual({ fromByte: 120, toByte: 450 });
    });
  });

  describe('a browser step against a browserless lane', () => {
    it('INVALID: {click against dungeonmaster-api} => throws BrowserStepUnsupportedError naming the spec', async () => {
      const proxy = stepDispatchBrokerProxy();
      const lane = proxy.browserlessLane({ specName: 'dungeonmaster-api' });
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message: 'Step click needs a browser, but spec dungeonmaster-api declares browser: false',
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('every browser verb is refused against a browserless lane, by name', () => {
    it.each(stepStatics.verbs.browser)(
      'INVALID: {%s against dungeonmaster-headless} => throws BrowserStepUnsupportedError naming that verb',
      async (verb) => {
        const proxy = stepDispatchBrokerProxy();
        const lane = proxy.browserlessLane({ specName: 'dungeonmaster-headless' });
        const step = StepStub({ step: verb });

        const error = await stepDispatchBroker({
          lane,
          step,
          index: StepIndexStub(),
          shotPath: null,
          browserWindowStart: null,
          lastShotPath: proxy.lastShotPath,
          setLastShotPath: proxy.setLastShotPath,
          recordBinding: NOOP,
        }).then(
          (): never => {
            throw new Error('Expected stepDispatchBroker to reject');
          },
          (caught: unknown): Error => caught as Error,
        );

        expect({ name: error.name, message: error.message }).toStrictEqual({
          name: 'BrowserStepUnsupportedError',
          message: `Step ${verb} needs a browser, but spec dungeonmaster-headless declares browser: false`,
        });
      },
    );
  });

  describe('a seed step against a browserless lane', () => {
    it('VALID: {seed against dungeonmaster-headless} => runs the recipe and returns ok true, proving the browser guard never fires', async () => {
      const proxy = stepDispatchBrokerProxy();
      const lane = proxy.browserlessLane({ specName: 'dungeonmaster-headless' });
      proxy.stagesSeedRecipe({ result: { guild: { id: 'g1' } } });
      const step = StepStub({ step: 'seed' });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect({ ok: result.ok, reading: JSON.parse(result.reading) }).toStrictEqual({
        ok: true,
        reading: { guild: { id: 'g1' } },
      });
    });

    it('VALID: {seed against a lane whose browser is present} => runs the same way, independent of the browser', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane } = proxy.happyLane();
      proxy.stagesSeedRecipe({ result: { guild: { id: 'g2' } } });
      const step = StepStub({ step: 'seed' });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath: null,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect({ ok: result.ok, reading: JSON.parse(result.reading) }).toStrictEqual({
        ok: true,
        reading: { guild: { id: 'g2' } },
      });
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        previousReading: null,
        delta: null,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        previousReading: null,
        delta: null,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        previousReading: null,
        delta: null,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        previousReading: null,
        delta: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
    });
  });

  describe('a real failure, not the declared expect: error attack', () => {
    it('ERROR: {click throws for a real reason, shotPath non-null} => captures the failure screenshot before rethrowing, wrapped with captured: true', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): StepFailureCaptureError => caught as StepFailureCaptureError,
      );

      expect({
        name: error.name,
        captured: error.captured,
        underlyingMessage: (error.underlyingError as Error).message,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        captured: true,
        underlyingMessage: 'AMBIGUOUS: 2 elements match [data-testid="X"]',
      });
      expect(captureCallArgs()).toStrictEqual([
        [
          {
            filePath:
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
          },
        ],
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe('boom');
      expect(captureCallArgs()).toStrictEqual([]);
    });

    it('ERROR: {click throws, the failure capture itself also throws} => the original click error still propagates, wrapped with captured: false', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.laneRejectingClickMatchAndCapture({
        clickError: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
        captureError: new Error('ENOSPC: no space left on device'),
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): StepFailureCaptureError => caught as StepFailureCaptureError,
      );

      expect({
        name: error.name,
        captured: error.captured,
        underlyingMessage: (error.underlyingError as Error).message,
      }).toStrictEqual({
        name: 'StepFailureCaptureError',
        captured: false,
        underlyingMessage: 'AMBIGUOUS: 2 elements match [data-testid="X"]',
      });
      expect(captureCallArgs()).toStrictEqual([
        [
          {
            filePath:
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
          },
        ],
      ]);
    });

    it('ERROR: {click throws for a real reason, the failure capture succeeds} => the wrapped error carries the measured blank, blankColour and pixelChange, not null', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane: firstLane } = proxy.happyLane();
      const firstShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const backgroundPixels = new Uint8Array(
        Array.from({ length: 8 }, () => backgroundPixel).flat(),
      );
      proxy.stagesShotFrame({
        shotPath: firstShotPath,
        width: 4,
        height: 2,
        pixels: backgroundPixels,
      });

      await stepDispatchBroker({
        lane: firstLane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 1 }),
        shotPath: firstShotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      const { lane: failingLane } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
      });
      const secondShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step2.png',
      });
      const whitePixel = [0xff, 0xff, 0xff, 255];
      const whitePixels = new Uint8Array(Array.from({ length: 8 }, () => whitePixel).flat());
      proxy.stagesShotFrame({ shotPath: secondShotPath, width: 4, height: 2, pixels: whitePixels });

      const error = await stepDispatchBroker({
        lane: failingLane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 2 }),
        shotPath: secondShotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): StepFailureCaptureError => caught as StepFailureCaptureError,
      );

      expect({
        captured: error.captured,
        blank: error.blank,
        blankColour: error.blankColour,
        pixelChange: error.pixelChange,
      }).toStrictEqual({
        captured: true,
        blank: true,
        blankColour: '#ffffff',
        pixelChange: '100%',
      });
    });

    it('ERROR: {click throws for a real reason, the failure capture succeeds but measuring it throws} => the readings stay null and the original click error still propagates', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane: firstLane } = proxy.happyLane();
      const firstShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const backgroundPixels = new Uint8Array(
        Array.from({ length: 8 }, () => backgroundPixel).flat(),
      );
      proxy.stagesShotFrame({
        shotPath: firstShotPath,
        width: 4,
        height: 2,
        pixels: backgroundPixels,
      });

      await stepDispatchBroker({
        lane: firstLane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 1 }),
        shotPath: firstShotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      const { lane: failingLane } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
      });
      const secondShotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step2.png',
      });
      // An evidence read failure proves measurement failures degrade gracefully instead of masking
      // the step's own error.
      proxy.stagesShotReadError({
        shotPath: secondShotPath,
        error: new Error('EACCES: permission denied, read'),
      });

      const error = await stepDispatchBroker({
        lane: failingLane,
        step: StepStub({ step: 'click', target: SelectorStub() }),
        index: StepIndexStub({ value: 2 }),
        shotPath: secondShotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): StepFailureCaptureError => caught as StepFailureCaptureError,
      );

      expect({
        captured: error.captured,
        blank: error.blank,
        blankColour: error.blankColour,
        pixelChange: error.pixelChange,
        underlyingMessage: (error.underlyingError as Error).message,
      }).toStrictEqual({
        captured: true,
        blank: null,
        blankColour: null,
        pixelChange: null,
        underlyingMessage: 'AMBIGUOUS: 2 elements match [data-testid="X"]',
      });
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.reading).toBe('typed "siege-1" into [data-testid="GUILD_ADD"]');
    });

    it('VALID: {screenshot} => the reading is the shot path, captured exactly once', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'screenshot', name: FileNameStub({ value: 'step1.png' }) });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.reading).toBe(
        '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      );
      expect(captureCallArgs()).toStrictEqual([
        [
          {
            filePath:
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
          },
        ],
      ]);
    });

    it('VALID: {health} => the reading is the rendered health line, captured exactly once', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'health' });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.reading).toBe(
        'DOWN      root present · page blank (#0d0907) · console clean · no 5xx · server log clean',
      );
      expect(captureCallArgs()).toStrictEqual([
        [
          {
            filePath:
              '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
          },
        ],
      ]);
    });

    it('VALID: {hold} => returns hold reading and skips dispatcher secondary capture', async () => {
      const proxy = stepDispatchBrokerProxy();
      const { lane, captureCallArgs } = proxy.happyLane();
      const step = StepStub({ step: 'hold', frames: 2, everyMs: 1000 });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });
      const backgroundPixel = [0x0d, 0x09, 0x07, 255];
      const pixels = new Uint8Array(Array.from({ length: 8 }, () => backgroundPixel).flat());
      proxy.stagesShotFrame({ shotPath, width: 4, height: 2, pixels });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.reading).toBe(
        '{"frames":2,"differing":0,"verdict":"NOTHING CHANGED across 1s","shots":["/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1_frame1.png","/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1_frame2.png"]}',
      );
      expect(captureCallArgs()).toStrictEqual([]);
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
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect(result.reading).toBe('"Guild Hall"');
    });
  });

  describe('the element delta', () => {
    it('VALID: {a successful click, before/after key listings differ} => the reading carries previousReading and a real delta with an appeared, a disappeared and a changed element', async () => {
      const proxy = stepDispatchBrokerProxy();
      const disappearingRow = KeyRowStub({ testId: 'el-disappear' });
      const changedBeforeRow = KeyRowStub({ testId: 'el-change', text: 'before-text' });
      const changedAfterRow = KeyRowStub({ testId: 'el-change', text: 'after-text' });
      const appearingRow = KeyRowStub({ testId: 'el-appear' });
      const beforeListing = KeyListingStub({ rows: [disappearingRow, changedBeforeRow] });
      const afterListing = KeyListingStub({ rows: [changedAfterRow, appearingRow] });
      const { lane } = proxy.happyLane({ keyListings: [beforeListing, afterListing] });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect({ previousReading: result.previousReading, delta: result.delta }).toStrictEqual({
        previousReading: beforeListing,
        delta: ElementDeltaStub({
          appeared: [appearingRow],
          disappeared: [disappearingRow],
          changed: [{ before: changedBeforeRow, after: changedAfterRow }],
        }),
      });
    });

    it('VALID: {a real failure whose capture lands, before/after key listings differ} => the thrown error carries previousReading and a real delta with an appeared, a disappeared and a changed element', async () => {
      const proxy = stepDispatchBrokerProxy();
      const disappearingRow = KeyRowStub({ testId: 'el-disappear' });
      const changedBeforeRow = KeyRowStub({ testId: 'el-change', text: 'before-text' });
      const changedAfterRow = KeyRowStub({ testId: 'el-change', text: 'after-text' });
      const appearingRow = KeyRowStub({ testId: 'el-appear' });
      const beforeListing = KeyListingStub({ rows: [disappearingRow, changedBeforeRow] });
      const afterListing = KeyListingStub({ rows: [changedAfterRow, appearingRow] });
      const { lane } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
        keyListings: [beforeListing, afterListing],
      });
      const step = StepStub({ step: 'click', target: SelectorStub() });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const error = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected stepDispatchBroker to reject');
        },
        (caught: unknown): StepFailureCaptureError => caught as StepFailureCaptureError,
      );

      expect({ previousReading: error.previousReading, delta: error.delta }).toStrictEqual({
        previousReading: beforeListing,
        delta: ElementDeltaStub({
          appeared: [appearingRow],
          disappeared: [disappearingRow],
          changed: [{ before: changedBeforeRow, after: changedAfterRow }],
        }),
      });
    });

    it('VALID: {expect: error, click throws as the declared attack, before/after key listings differ} => the reading carries previousReading and a real delta with an appeared, a disappeared and a changed element', async () => {
      const proxy = stepDispatchBrokerProxy();
      const disappearingRow = KeyRowStub({ testId: 'el-disappear' });
      const changedBeforeRow = KeyRowStub({ testId: 'el-change', text: 'before-text' });
      const changedAfterRow = KeyRowStub({ testId: 'el-change', text: 'after-text' });
      const appearingRow = KeyRowStub({ testId: 'el-appear' });
      const beforeListing = KeyListingStub({ rows: [disappearingRow, changedBeforeRow] });
      const afterListing = KeyListingStub({ rows: [changedAfterRow, appearingRow] });
      const { lane } = proxy.laneRejectingClickMatch({
        error: new Error('AMBIGUOUS: 2 elements match [data-testid="X"]'),
        keyListings: [beforeListing, afterListing],
      });
      const step = StepStub({ step: 'click', target: SelectorStub(), expect: 'error' });
      const shotPath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step1.png',
      });

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
        browserWindowStart: null,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
        recordBinding: NOOP,
      });

      expect({ previousReading: result.previousReading, delta: result.delta }).toStrictEqual({
        previousReading: beforeListing,
        delta: ElementDeltaStub({
          appeared: [appearingRow],
          disappeared: [disappearingRow],
          changed: [{ before: changedBeforeRow, after: changedAfterRow }],
        }),
      });
    });
  });
});
