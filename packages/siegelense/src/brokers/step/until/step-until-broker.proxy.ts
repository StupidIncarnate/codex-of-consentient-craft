// PURPOSE: Proxy for step-until-broker — builds a LaneSession whose BrowserSession answers each
// of the four browser forms (visible/predicate/console/response), a browserless LaneSession for the
// refusal path, and composes until-file-wait-layer-broker's own proxy for the `file` form's one I/O
// boundary (fs.stat). Stages Date.now ONLY when a test needs a controlled "waited Xms" figure.
// USAGE: const proxy = stepUntilBrokerProxy(); const { lane } = proxy.laneVisibleResolving();

import { z } from 'zod';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type {
  BrowserSession,
  BufferLengths,
} from '../../../contracts/browser-session/browser-session-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { untilBufferMatchLayerBrokerProxy } from './until-buffer-match-layer-broker.proxy';
import { untilFileWaitLayerBrokerProxy } from './until-file-wait-layer-broker.proxy';

// Re-declared locally rather than imported: browser-session-contract.ts keeps its own parsing
// contract private, the same reason run-execute-broker.proxy.ts re-declares this identical brand.
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();
// Offset from the real run-start count, staged as `bufferLengths()`'s own decoy return — a caller
// that wrongly reads a fresh `session.bufferLengths()` instead of the `browserWindowStart` it was
// handed asks `readConsoleSince`/`readNetworkSince` for THIS index, which resolves to no lines below,
// so a regression back to the step-start read is a ceiling timeout here, never a silently-green test.
const DECOY_OFFSET = 1000;

// The shape Playwright's own `TimeoutError` arrives in — `name` is its public discriminator, and a
// ceiling proxy that skips it stages a rejection this broker is SUPPOSED to rethrow rather than
// fold into a ceiling, so the two would be indistinguishable in every test.
const playwrightTimeoutError = (): Error => {
  const error = new Error('Timeout 30000ms exceeded.');
  error.name = 'TimeoutError';
  return error;
};

const STRICT_MODE_VIOLATION_MESSAGE =
  'strict mode violation: locator(\'[data-testid="PIXEL_BTN"]\') resolved to 2 elements';
const PREDICATE_THREW_MESSAGE = 'ReferenceError: quests is not defined';

export const stepUntilBrokerProxy = (): {
  laneVisibleResolving: () => { lane: LaneSession };
  laneVisibleHittingCeiling: () => { lane: LaneSession };
  laneVisibleAmbiguous: () => { lane: LaneSession };
  lanePredicateResolving: () => { lane: LaneSession };
  lanePredicateHittingCeiling: () => { lane: LaneSession };
  lanePredicateThrowing: () => { lane: LaneSession };
  laneConsoleAnswering: (params: {
    linesSinceStep: readonly string[];
    consoleLinesAtStart: number;
  }) => { lane: LaneSession; browserWindowStart: BufferLengths };
  laneResponseAnswering: (params: {
    linesSinceStep: readonly string[];
    networkLinesAtStart: number;
  }) => { lane: LaneSession; browserWindowStart: BufferLengths };
  laneWithoutBrowser: () => { lane: LaneSession };
  laneForFile: (params: { homePath: string }) => {
    lane: LaneSession;
    fileProxy: ReturnType<typeof untilFileWaitLayerBrokerProxy>;
  };
  stageElapsedMs: (params: { nowMs: number }) => void;
} => {
  const fileWaitProxy = untilFileWaitLayerBrokerProxy();
  // Constructed for its own default behavior only, to satisfy enforce-proxy-child-creation — the
  // console/response scenarios below build their `readConsoleSince`/`readNetworkSince` mocks
  // directly on the BrowserSession, the same real boundary `untilBufferMatchLayerBroker` drives,
  // so this proxy is never addressed further. Same pattern as run-verb-layer-broker.proxy.ts's own
  // unaddressed child proxy constructions.
  untilBufferMatchLayerBrokerProxy();

  const laneOverBrowser = (session: BrowserSession): { lane: LaneSession } => ({
    lane: LaneSessionStub({ browser: session }),
  });

  return {
    laneVisibleResolving: (): { lane: LaneSession } =>
      laneOverBrowser(BrowserSessionStub({ waitForMatch: jest.fn().mockResolvedValue(undefined) })),

    laneVisibleHittingCeiling: (): { lane: LaneSession } =>
      laneOverBrowser(
        BrowserSessionStub({
          waitForMatch: jest.fn().mockRejectedValue(playwrightTimeoutError()),
        }),
      ),

    // A selector matching two elements. Playwright's locator is strict, and `until { visible }` is
    // the one wait that never pre-resolves, so this rejection is what an ambiguous target produces
    // here — and it is NOT a ceiling.
    laneVisibleAmbiguous: (): { lane: LaneSession } =>
      laneOverBrowser(
        BrowserSessionStub({
          waitForMatch: jest.fn().mockRejectedValue(new Error(STRICT_MODE_VIOLATION_MESSAGE)),
        }),
      ),

    lanePredicateResolving: (): { lane: LaneSession } =>
      laneOverBrowser(
        BrowserSessionStub({ waitForPredicate: jest.fn().mockResolvedValue(undefined) }),
      ),

    lanePredicateHittingCeiling: (): { lane: LaneSession } =>
      laneOverBrowser(
        BrowserSessionStub({
          waitForPredicate: jest.fn().mockRejectedValue(playwrightTimeoutError()),
        }),
      ),

    // Source that cannot evaluate at all, rather than source that evaluates false.
    lanePredicateThrowing: (): { lane: LaneSession } =>
      laneOverBrowser(
        BrowserSessionStub({
          waitForPredicate: jest.fn().mockRejectedValue(new Error(PREDICATE_THREW_MESSAGE)),
        }),
      ),

    // `bufferLengths()` is staged to the DECOY offset, never `consoleLinesAtStart` itself: the fix
    // this proxy exists to prove is that `stepUntilBroker` reads `fromIndex` off the
    // `browserWindowStart` it was HANDED, not off a fresh `session.bufferLengths()` call — so
    // `readConsoleSince` only answers `linesSinceStep` for the real run-start index, and answers `[]`
    // for the decoy, the same way a live BrowserSession answers a fromIndex past its own tail.
    laneConsoleAnswering: ({
      linesSinceStep,
      consoleLinesAtStart,
    }: {
      linesSinceStep: readonly string[];
      consoleLinesAtStart: number;
    }): { lane: LaneSession; browserWindowStart: BufferLengths } => ({
      lane: laneOverBrowser(
        BrowserSessionStub({
          bufferLengths: jest.fn().mockReturnValue({
            consoleLines: consoleLinesAtStart + DECOY_OFFSET,
            networkLines: 0,
            websocketLines: 0,
          }),
          readConsoleSince: jest
            .fn()
            .mockImplementation(({ fromIndex }: { fromIndex: number }) =>
              fromIndex === consoleLinesAtStart ? linesSinceStep : [],
            ),
        }),
      ).lane,
      browserWindowStart: {
        consoleLines: bufferLineCountContract.parse(consoleLinesAtStart),
        networkLines: bufferLineCountContract.parse(0),
        websocketLines: bufferLineCountContract.parse(0),
      },
    }),

    laneResponseAnswering: ({
      linesSinceStep,
      networkLinesAtStart,
    }: {
      linesSinceStep: readonly string[];
      networkLinesAtStart: number;
    }): { lane: LaneSession; browserWindowStart: BufferLengths } => ({
      lane: laneOverBrowser(
        BrowserSessionStub({
          bufferLengths: jest.fn().mockReturnValue({
            consoleLines: 0,
            networkLines: networkLinesAtStart + DECOY_OFFSET,
            websocketLines: 0,
          }),
          readNetworkSince: jest
            .fn()
            .mockImplementation(({ fromIndex }: { fromIndex: number }) =>
              fromIndex === networkLinesAtStart ? linesSinceStep : [],
            ),
        }),
      ).lane,
      browserWindowStart: {
        consoleLines: bufferLineCountContract.parse(0),
        networkLines: bufferLineCountContract.parse(networkLinesAtStart),
        websocketLines: bufferLineCountContract.parse(0),
      },
    }),

    laneWithoutBrowser: (): { lane: LaneSession } => ({
      lane: LaneSessionStub({ browser: null, specName: 'dungeonmaster-headless' }),
    }),

    // `browser: null` on purpose — R13's whole point is that `file` runs WITHOUT one, on a
    // browserless lane exactly as it runs on `dungeonmaster-web`.
    laneForFile: ({
      homePath,
    }: {
      homePath: string;
    }): { lane: LaneSession; fileProxy: ReturnType<typeof untilFileWaitLayerBrokerProxy> } => ({
      lane: LaneSessionStub({ homePath, browser: null }),
      fileProxy: fileWaitProxy,
    }),

    stageElapsedMs: ({ nowMs }: { nowMs: number }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(nowMs);
    },
  };
};
