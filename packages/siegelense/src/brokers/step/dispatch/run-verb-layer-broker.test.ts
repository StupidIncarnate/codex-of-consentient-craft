import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';

import { runVerbLayerBroker } from './run-verb-layer-broker';
import { runVerbLayerBrokerProxy } from './run-verb-layer-broker.proxy';

describe('runVerbLayerBroker', () => {
  describe('a targeting step resolves before acting', () => {
    it('VALID: {click, one match} => calls countMatches before clickMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'click', target: SelectorStub() });

      await runVerbLayerBroker({ lane, step, index: StepIndexStub(), shotPath: null });

      expect(callOrder()).toStrictEqual(['countMatches', 'clickMatch']);
    });

    it('VALID: {type, one match} => calls countMatches before fillMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'type', target: SelectorStub(), value: ContentTextStub() });

      await runVerbLayerBroker({ lane, step, index: StepIndexStub(), shotPath: null });

      expect(callOrder()).toStrictEqual(['countMatches', 'fillMatch']);
    });

    it('VALID: {waitFor, one match} => calls countMatches before waitForMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'waitFor', target: SelectorStub() });

      await runVerbLayerBroker({ lane, step, index: StepIndexStub(), shotPath: null });

      expect(callOrder()).toStrictEqual(['countMatches', 'waitForMatch']);
    });
  });

  describe('an ambiguous target', () => {
    it('INVALID: {click, two matches} => throws StepAmbiguousError and never calls clickMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, session } = proxy.sessionWithTwoMatches();
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
      }).then(
        (): never => {
          throw new Error('Expected runVerbLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.name).toBe('StepAmbiguousError');
      expect(session.clickMatch).toHaveBeenCalledTimes(0);
    });
  });

  describe('a non-targeting step never resolves', () => {
    it('VALID: {goto} => returns the path with no resolve call', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const path = UrlPathStub();
      const step = StepStub({ step: 'goto', path });

      const result = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
      });

      expect(result).toBe(path);
      expect(callOrder()).toStrictEqual([]);
    });
  });

  describe('a screenshot step with no shotPath', () => {
    it('ERROR: {screenshot, shotPath: null} => throws naming the step index', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'screenshot' });
      const index = StepIndexStub({ value: 3 });

      const error = await runVerbLayerBroker({ lane, step, index, shotPath: null }).then(
        (): never => {
          throw new Error('Expected runVerbLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe(
        "run-verb-layer-broker: a 'screenshot' step (step 3) requires a non-null shotPath",
      );
    });
  });

  describe('a seed step', () => {
    it('VALID: {seed, browserless lane} => delegates to stepSeedBroker and returns its reading', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { getSeedRunCallArgs } = proxy.stagesSeedRecipe({ result: { guild: { id: 'g1' } } });
      const lane = LaneSessionStub({ browser: null });
      const step = StepStub({ step: 'seed' });
      const index = StepIndexStub({ value: 1 });

      const reading = await runVerbLayerBroker({ lane, step, index, shotPath: null });

      expect(JSON.parse(reading)).toStrictEqual({ guild: { id: 'g1' } });
      expect(getSeedRunCallArgs()).toStrictEqual([
        [
          {
            recipeName: 'guild-mid-execution',
            params: null,
            home: '/tmp/dm-siege-stub',
            baseUrl: 'http://127.0.0.1:0',
          },
        ],
      ]);
    });
  });
});
