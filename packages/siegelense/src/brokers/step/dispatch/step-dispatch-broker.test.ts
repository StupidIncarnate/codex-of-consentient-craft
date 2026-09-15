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

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
      });
      expect(captureCallArgs()).toStrictEqual([
        [{ filePath: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png' }],
      ]);
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
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'error',
        reading: 'boom',
        shot: null,
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
      });

      expect(result).toStrictEqual({
        step: 1,
        verb: 'click',
        node: null,
        ok: false,
        expected: 'error',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: null,
        startedAtMs: FIXED_NOW_MS,
        endedAtMs: FIXED_NOW_MS,
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

      const result = await stepDispatchBroker({
        lane,
        step,
        index: StepIndexStub({ value: 1 }),
        shotPath,
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
      });

      expect(result.reading).toBe('"Guild Hall"');
    });
  });
});
