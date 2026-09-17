import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { UntilConsolePatternStub } from '../../../contracts/until-console-pattern/until-console-pattern.stub';
import { UntilFilePathStub } from '../../../contracts/until-file-path/until-file-path.stub';
import { UntilResponseStub } from '../../../contracts/until-response/until-response.stub';
import { stepUntilBroker } from './step-until-broker';
import { stepUntilBrokerProxy } from './step-until-broker.proxy';

describe('stepUntilBroker', () => {
  describe('visible', () => {
    it('VALID: {visible resolves} => returns the exact reading naming the target and the elapsed time', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.laneVisibleResolving();
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await stepUntilBroker({
        lane,
        visible: '[data-testid="SUBAGENT_CHAIN"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 20000,
        browserWindowStart: null,
      });

      expect(reading).toBe('[data-testid="SUBAGENT_CHAIN"] became visible after 0ms');
    });

    it("ERROR: {visible hits its ceiling} => throws UntilCeilingHitError with the spec's own exact wording", async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.laneVisibleHittingCeiling();

      const error = await stepUntilBroker({
        lane,
        visible: '[data-testid="SUBAGENT_CHAIN"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 20000,
        browserWindowStart: null,
      }).then(
        (): never => {
          throw new Error('Expected stepUntilBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
      });
    });

    it('ERROR: {visible matches two elements} => rethrows the strict-mode violation unchanged, never as a ceiling', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.laneVisibleAmbiguous();

      const error = await stepUntilBroker({
        lane,
        visible: '[data-testid="PIXEL_BTN"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 20000,
        browserWindowStart: null,
      }).then(
        (): never => {
          throw new Error('Expected stepUntilBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      // The verdict half of this matters as much as the message: `runExecuteStepLayerBroker` reads
      // `instanceof UntilCeilingHitError` for `timedOut`, so an ambiguity folded into a ceiling
      // would make the whole run answer `status: 'timeout'` and advise waiting longer for an
      // element that is already on the screen twice.
      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'Error',
        message:
          'strict mode violation: locator(\'[data-testid="PIXEL_BTN"]\') resolved to 2 elements',
      });
    });
  });

  describe('predicate', () => {
    it('VALID: {predicate resolves} => returns the exact reading, with no source echoed', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.lanePredicateResolving();
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await stepUntilBroker({
        lane,
        visible: null,
        response: null,
        file: null,
        predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3',
        console: null,
        timeoutMs: null,
        browserWindowStart: null,
      });

      expect(reading).toBe('predicate became true after 0ms');
    });

    it('ERROR: {predicate hits its ceiling} => throws UntilCeilingHitError naming the predicate and the ceiling', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.lanePredicateHittingCeiling();

      const error = await stepUntilBroker({
        lane,
        visible: null,
        response: null,
        file: null,
        predicate: 'false',
        console: null,
        timeoutMs: 5000,
        browserWindowStart: null,
      }).then(
        (): never => {
          throw new Error('Expected stepUntilBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message: 'predicate false never resolved in 5000ms',
      });
    });

    it('ERROR: {predicate source cannot evaluate} => rethrows the page error unchanged, so a BROKEN predicate never reads as a false one', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.lanePredicateThrowing();

      const error = await stepUntilBroker({
        lane,
        visible: null,
        response: null,
        file: null,
        predicate: 'quests.length === 3',
        console: null,
        timeoutMs: 5000,
        browserWindowStart: null,
      }).then(
        (): never => {
          throw new Error('Expected stepUntilBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'Error',
        message: 'ReferenceError: quests is not defined',
      });
    });
  });

  describe('console', () => {
    it('VALID: {a matching line since the run began, fromIndex taken from browserWindowStart} => returns the exact reading, echoing the matched text', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane, browserWindowStart } = proxy.laneConsoleAnswering({
        linesSinceStep: [JSON.stringify({ text: 'app hydrated in 240ms' })],
        consoleLinesAtStart: 0,
      });
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await stepUntilBroker({
        lane,
        visible: null,
        response: null,
        file: null,
        predicate: null,
        console: UntilConsolePatternStub({ value: 'hydrated' }),
        timeoutMs: null,
        browserWindowStart,
      });

      expect(reading).toBe(
        'console line matching /hydrated/ arrived after 0ms — "app hydrated in 240ms"',
      );
    });
  });

  describe('response', () => {
    it('VALID: {a matching exchange since the run began, fromIndex taken from browserWindowStart} => returns the exact reading, echoing the answered status', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane, browserWindowStart } = proxy.laneResponseAnswering({
        linesSinceStep: [JSON.stringify({ method: 'POST', url: '/api/quests', status: 201 })],
        networkLinesAtStart: 0,
      });
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await stepUntilBroker({
        lane,
        visible: null,
        response: UntilResponseStub({ method: 'POST', path: '/api/quests' }),
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 15000,
        browserWindowStart,
      });

      expect(reading).toBe('POST /api/quests answered 201 after 0ms');
    });
  });

  describe('file', () => {
    it('VALID: {the file is already there} => returns the exact reading, needing no browser at all', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane, fileProxy } = proxy.laneForFile({ homePath: '/tmp/dm-siege-inst_1' });
      fileProxy.fileAppears({
        filePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/guilds/g1/quest.json' }),
      });
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await stepUntilBroker({
        lane,
        visible: null,
        response: null,
        file: UntilFilePathStub({ value: 'guilds/g1/quest.json' }),
        predicate: null,
        console: null,
        timeoutMs: 10000,
        browserWindowStart: null,
      });

      expect(reading).toBe('guilds/g1/quest.json appeared after 0ms');
    });
  });

  describe('a browserless lane', () => {
    it('ERROR: {visible against a browserless lane} => refuses by NAME, naming the form and the file alternative', async () => {
      const proxy = stepUntilBrokerProxy();
      const { lane } = proxy.laneWithoutBrowser();

      const error = await stepUntilBroker({
        lane,
        visible: '[data-testid="SUBAGENT_CHAIN"]',
        response: null,
        file: null,
        predicate: null,
        console: null,
        timeoutMs: 20000,
        browserWindowStart: null,
      }).then(
        (): never => {
          throw new Error('Expected stepUntilBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BrowserStepUnsupportedError',
        message:
          'Step until { visible } needs a browser, but spec dungeonmaster-headless declares browser: false — until { file } is the form that runs on a lane with no screen',
      });
    });
  });
});
