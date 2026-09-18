import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { SelectorStub } from '../../../contracts/selector/selector.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';

import { runVerbLayerBroker } from './run-verb-layer-broker';
import { runVerbLayerBrokerProxy } from './run-verb-layer-broker.proxy';

// Every case below drives a browser verb; `recordBinding` only ever fires for `seed`, which has
// its own coverage in step-seed-broker.test.ts.
const NOOP = (): void => undefined;

describe('runVerbLayerBroker', () => {
  describe('a targeting step resolves before acting', () => {
    it('VALID: {click, one match} => calls countMatches before clickMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'click', target: SelectorStub() });

      await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual(['countMatches', 'clickMatch']);
    });

    it('VALID: {type, one match} => calls countMatches before fillMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'type', target: SelectorStub(), value: ContentTextStub() });

      await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual(['countMatches', 'fillMatch']);
    });

    it('VALID: {waitFor, one match} => calls countMatches before waitForMatch', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'waitFor', target: SelectorStub() });

      await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual(['countMatches', 'waitForMatch']);
    });

    it('VALID: {box, live ref} => resolves refState then calls boxRef', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'box', ref: 26 });

      const result = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual(['refState', 'boxRef']);
      expect(result).toBe(
        '{"ref":26,"x":607,"y":472,"width":66,"height":27,"viewport":{"width":1280,"height":720},"visible":true,"inViewport":true}',
      );
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
        browserWindowStart: null,
        recordBinding: NOOP,
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
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(result).toBe(path);
      expect(callOrder()).toStrictEqual([]);
    });

    it('VALID: {dom} => calls readDom directly without resolving and returns rendered JSON', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'dom', target: SelectorStub() });

      const result = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual(['readDom']);
      expect(result).toBe(
        '{"count":1,"showing":1,"capped":false,"note":null,"nodes":[{"tagName":"button","testId":"SUBMIT_BTN","className":"btn primary","childCount":0,"display":"inline-block","visibility":"visible","opacity":"1","rect":{"x":10,"y":20,"width":100,"height":50},"text":"Submit","attrs":[],"value":null}]}',
      );
    });

    it('VALID: {key} => calls pressKey and returns rendered key result', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane, callOrder } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'key', press: ContentTextStub({ value: 'Enter' }) });

      const result = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(callOrder()).toStrictEqual([]);
      expect(result).toBe('pressed "Enter" — nothing focused');
    });
  });

  describe('a browser verb against a browserless lane', () => {
    it('ERROR: {click, lane.browser === null} => refuses by NAME rather than acting on nothing', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.browserlessLane();
      const step = StepStub({ step: 'click', target: SelectorStub() });

      const error = await runVerbLayerBroker({
        lane,
        step,
        index: StepIndexStub(),
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      }).then(
        (): never => {
          throw new Error('Expected runVerbLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.name).toBe('BrowserStepUnsupportedError');
    });
  });

  describe('a screenshot step with no shotPath', () => {
    it('ERROR: {screenshot, shotPath: null} => throws naming the step index', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'screenshot' });
      const index = StepIndexStub({ value: 3 });

      const error = await runVerbLayerBroker({
        lane,
        step,
        index,
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      }).then(
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

  describe('a health step', () => {
    it('VALID: {health} => routes to stepHealthBroker and returns health reading', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'health' });
      const index = StepIndexStub({ value: 1 });

      const reading = await runVerbLayerBroker({
        lane,
        step,
        index,
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(reading).toBe(
        'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
      );
    });
  });

  describe('a resize step', () => {
    it('VALID: {resize} => routes to stepResizeBroker and returns resize reading', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.sessionWithOneMatch();
      const step = StepStub({ step: 'resize', width: 1280, height: 720 });
      const index = StepIndexStub({ value: 1 });

      const reading = await runVerbLayerBroker({
        lane,
        step,
        index,
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(reading).toBe('resized to 1280x720');
    });
  });

  describe('a request step', () => {
    it('VALID: {request, browserless lane} => routes to stepRequestBroker and returns reading', async () => {
      const proxy = runVerbLayerBrokerProxy();
      const { lane } = proxy.browserlessLane();
      const step = StepStub({
        step: 'request',
        method: 'GET',
        path: '/api/guilds',
      });
      const index = StepIndexStub({ value: 1 });

      proxy.setupRequestResponse({
        url: 'http://127.0.0.1:34172/api/guilds',
        status: 200,
        statusText: 'OK',
        body: [{ id: 'guild-1' }],
      });

      const reading = await runVerbLayerBroker({
        lane,
        step,
        index,
        shotPath: null,
        browserWindowStart: null,
        recordBinding: NOOP,
      });

      expect(reading).toBe('200 OK — [{"id":"guild-1"}]');
    });
  });
});
