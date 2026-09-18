import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { BoxReadingStub } from '../../../contracts/box-reading/box-reading.stub';
import { DomReadingStub } from '../../../contracts/dom-reading/dom-reading.stub';
import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { RefResolutionStub } from '../../../contracts/ref-resolution/ref-resolution.stub';
import { stepBoxBrokerProxy } from '../box/step-box-broker.proxy';
import { stepBeforeBrokerProxy } from '../before/step-before-broker.proxy';
import { stepClickBrokerProxy } from '../click/step-click-broker.proxy';
import { stepDomBrokerProxy } from '../dom/step-dom-broker.proxy';
import { stepEvalSourceBrokerProxy } from '../eval-source/step-eval-source-broker.proxy';
import { stepFileBrokerProxy } from '../file/step-file-broker.proxy';
import { stepGotoBrokerProxy } from '../goto/step-goto-broker.proxy';
import { stepHealthBrokerProxy } from '../health/step-health-broker.proxy';
import { stepHoldBrokerProxy } from '../hold/step-hold-broker.proxy';
import { stepKeyBrokerProxy } from '../key/step-key-broker.proxy';
import { stepLookBrokerProxy } from '../look/step-look-broker.proxy';
import { stepRequestBrokerProxy } from '../request/step-request-broker.proxy';
import { stepResizeBrokerProxy } from '../resize/step-resize-broker.proxy';
import { stepScreenshotBrokerProxy } from '../screenshot/step-screenshot-broker.proxy';
import { stepSeedBrokerProxy } from '../seed/step-seed-broker.proxy';
import { stepSnapshotBrokerProxy } from '../snapshot/step-snapshot-broker.proxy';
import { stepStorageBrokerProxy } from '../storage/step-storage-broker.proxy';
import { stepPasteBrokerProxy } from '../paste/step-paste-broker.proxy';
import { stepTargetResolveBrokerProxy } from '../target-resolve/step-target-resolve-broker.proxy';
import { stepTypeBrokerProxy } from '../type/step-type-broker.proxy';
import { stepUntilBrokerProxy } from '../until/step-until-broker.proxy';
import { stepVideoBrokerProxy } from '../video/step-video-broker.proxy';
import { stepWaitForBrokerProxy } from '../wait-for/step-wait-for-broker.proxy';

// browserSessionContract carries no MatchCount export of its own (contracts/ exposes only the
// inferred type) — the same local re-declaration step-target-resolve-broker.proxy.ts already uses.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const TWO_MATCHES_COUNT = 2;

export const runVerbLayerBrokerProxy = (): {
  sessionWithOneMatch: () => {
    lane: LaneSession;
    session: BrowserSession;
    callOrder: () => readonly ContentText[];
  };
  sessionWithTwoMatches: () => { lane: LaneSession; session: BrowserSession };
  browserlessLane: (params?: { apiBaseUrl?: ContentText }) => { lane: LaneSession };
  seedBookPresentAt: (params: { packagePath: string }) => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
  setupRequestResponse: (params: {
    url: string;
    status?: number;
    statusText?: string;
    headers?: Record<PropertyKey, unknown>;
    body?: unknown;
  }) => void;
  setupFileExists: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  setupFileNotFound: (params: { filePath: AbsoluteFilePath }) => void;
  setupSnapshotEmptyStore: (params: { homePath: AbsoluteFilePath }) => void;
} => {
  // Constructed for their own default behavior only to satisfy enforce-proxy-child-creation — this
  // proxy builds its own BrowserSession scenarios directly (the real boundary every child broker
  // ultimately drives), so none of these is addressed further. Same pattern as
  // lane-boot-broker.proxy.ts's own unaddressed child proxy constructions.
  // Construction matches lane-boot-broker.proxy.ts pattern
  stepBoxBrokerProxy();
  stepBeforeBrokerProxy();
  stepClickBrokerProxy();
  stepDomBrokerProxy();
  stepEvalSourceBrokerProxy();
  stepGotoBrokerProxy();
  stepHealthBrokerProxy();
  stepHoldBrokerProxy();
  stepKeyBrokerProxy();
  stepLookBrokerProxy();
  stepResizeBrokerProxy();
  const requestProxy = stepRequestBrokerProxy();
  const fileProxy = stepFileBrokerProxy();
  stepScreenshotBrokerProxy();
  stepStorageBrokerProxy();
  stepPasteBrokerProxy();
  stepTargetResolveBrokerProxy();
  stepTypeBrokerProxy();
  stepUntilBrokerProxy();
  stepVideoBrokerProxy();
  stepWaitForBrokerProxy();
  const snapshotProxy = stepSnapshotBrokerProxy();
  // Assigned, unlike the rest: `seed` is the one verb whose broker a caller stages through this
  // layer, so a batch test can prove a binding resolved against ids a REAL recipe returned.
  const seedProxy = stepSeedBrokerProxy();

  return {
    sessionWithOneMatch: (): {
      lane: LaneSession;
      session: BrowserSession;
      callOrder: () => readonly ContentText[];
    } => {
      const order: ContentText[] = [];
      const session = BrowserSessionStub({
        countMatches: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('countMatches'));
          return Promise.resolve(matchCountContract.parse(1));
        }),
        clickMatch: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('clickMatch'));
          return Promise.resolve();
        }),
        fillMatch: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('fillMatch'));
          return Promise.resolve();
        }),
        pasteMatch: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('pasteMatch'));
          return Promise.resolve();
        }),
        waitForMatch: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('waitForMatch'));
          return Promise.resolve();
        }),
        refState: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('refState'));
          return Promise.resolve(RefResolutionStub({ state: 'live' }));
        }),
        boxRef: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('boxRef'));
          return Promise.resolve(BoxReadingStub());
        }),
        readDom: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('readDom'));
          return Promise.resolve(DomReadingStub());
        }),
      });
      // The LANE wrapping that session — `runVerbLayerBroker` takes the whole lane now, because
      // `seed` needs the api port and the throwaway home and no page at all.
      return {
        lane: LaneSessionStub({ browser: session }),
        session,
        callOrder: (): readonly ContentText[] => order,
      };
    },

    sessionWithTwoMatches: (): { lane: LaneSession; session: BrowserSession } => {
      const session = BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(TWO_MATCHES_COUNT)),
        describeMatches: jest.fn().mockResolvedValue([]),
        clickMatch: jest.fn().mockResolvedValue(undefined),
        pasteMatch: jest.fn().mockResolvedValue(undefined),
      });
      return { lane: LaneSessionStub({ browser: session }), session };
    },

    browserlessLane: (params?: { apiBaseUrl?: ContentText }): { lane: LaneSession } => ({
      lane: LaneSessionStub({
        browser: null,
        apiBaseUrl: params?.apiBaseUrl ?? contentTextContract.parse('http://127.0.0.1:34172'),
      }),
    }),

    seedBookPresentAt: ({ packagePath }: { packagePath: string }): void => {
      seedProxy.bookPresentAt({ packagePath });
    },

    seedLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: unknown;
      questIds: readonly ContentText[];
    }): void => {
      seedProxy.guildLaneAnswers({ apiBaseUrl, guild, questIds });
    },

    setupRequestResponse: ({
      url,
      status,
      statusText,
      headers,
      body,
    }: {
      url: string;
      status?: number;
      statusText?: string;
      headers?: Record<PropertyKey, unknown>;
      body?: unknown;
    }): void => {
      requestProxy.setupResponse({
        url,
        ...(status === undefined ? {} : { status }),
        ...(statusText === undefined ? {} : { statusText }),
        ...(headers === undefined ? {} : { headers }),
        ...(body === undefined ? {} : { body }),
      });
    },

    setupFileExists: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: string;
    }): void => {
      fileProxy.setupFileExists({ filePath, content });
    },

    setupFileNotFound: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      fileProxy.setupFileNotFound({ filePath });
    },

    setupSnapshotEmptyStore: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      snapshotProxy.setupEmptyStore({ homePath });
    },
  };
};
