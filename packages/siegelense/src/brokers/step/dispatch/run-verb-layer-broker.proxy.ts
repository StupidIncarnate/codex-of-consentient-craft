import { z } from 'zod';
import { ContentTextStub, contentTextContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  ContentText,
  FilePath,
  Guild,
} from '@dungeonmaster/shared/contracts';

import { BoxReadingStub } from '../../../contracts/box-reading/box-reading.stub';
import { DomReadingStub } from '../../../contracts/dom-reading/dom-reading.stub';
import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import type { SeedResult } from '../../../contracts/seed-result/seed-result-contract';
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
import { stepResetBrokerProxy } from '../reset/step-reset-broker.proxy';
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
  stagesSeedRecipe: (params: { result: unknown }) => {
    getSeedRunCallArgs: () => readonly unknown[];
  };
  seedBookPresentAt: (params: { packagePath: FilePath }) => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: Guild;
    questIds: readonly ContentText[];
  }) => void;
  browserlessLane: (params?: { apiBaseUrl?: ContentText }) => { lane: LaneSession };
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
  stepResetBrokerProxy();
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

    stagesSeedRecipe: ({
      result,
    }: {
      result: unknown;
    }): { getSeedRunCallArgs: () => readonly unknown[] } => {
      seedProxy.stagesListing({ listing: [RecipeListingEntryStub()] });
      const seedRun = seedProxy.stagesSeedRun({ result });
      return { getSeedRunCallArgs: seedRun.getCallArgs };
    },

    seedBookPresentAt: ({ packagePath }: { packagePath: FilePath }): void => {
      seedProxy.bookPresentAt({ packagePath });
    },

    seedLaneAnswers: ({
      apiBaseUrl: _apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: Guild;
      questIds: readonly ContentText[];
    }): void => {
      const activeQuestId =
        questIds[1] ??
        questIds[0] ??
        ContentTextStub({ value: 'bbbbbbbb-2222-4222-8222-222222222222' });
      const result: SeedResult = SeedResultStub({
        guildId: guild.id,
        guildSlug: ContentTextStub({ value: guild.urlSlug ?? 'siege-guild' }),
        questId: activeQuestId,
      });
      seedProxy.stagesListing({
        listing: [
          RecipeListingEntryStub({
            recipeName: 'guild-with-three-quests' as never,
            inputKeys: [],
          }),
          RecipeListingEntryStub({
            recipeName: 'guild-mid-execution' as never,
            inputKeys: [],
          }),
        ],
      });
      seedProxy.stagesSeedRun({ result });
    },

    browserlessLane: (params?: { apiBaseUrl?: ContentText }): { lane: LaneSession } => ({
      lane: LaneSessionStub({
        browser: null,
        apiBaseUrl: params?.apiBaseUrl ?? contentTextContract.parse('http://127.0.0.1:34172'),
      }),
    }),

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
