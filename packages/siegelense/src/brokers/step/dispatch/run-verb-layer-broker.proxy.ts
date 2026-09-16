import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { stepClickBrokerProxy } from '../click/step-click-broker.proxy';
import { stepEvalSourceBrokerProxy } from '../eval-source/step-eval-source-broker.proxy';
import { stepGotoBrokerProxy } from '../goto/step-goto-broker.proxy';
import { stepScreenshotBrokerProxy } from '../screenshot/step-screenshot-broker.proxy';
import { stepSeedBrokerProxy } from '../seed/step-seed-broker.proxy';
import { stepTargetResolveBrokerProxy } from '../target-resolve/step-target-resolve-broker.proxy';
import { stepTypeBrokerProxy } from '../type/step-type-broker.proxy';
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
} => {
  // Constructed for their own default behavior only to satisfy enforce-proxy-child-creation — this
  // proxy builds its own BrowserSession scenarios directly (the real boundary every child broker
  // ultimately drives), so none of these is addressed further. Same pattern as
  // lane-boot-broker.proxy.ts's own unaddressed child proxy constructions.
  stepClickBrokerProxy();
  stepEvalSourceBrokerProxy();
  stepGotoBrokerProxy();
  stepScreenshotBrokerProxy();
  stepTargetResolveBrokerProxy();
  stepTypeBrokerProxy();
  stepWaitForBrokerProxy();
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
        waitForMatch: jest.fn().mockImplementation(async () => {
          order.push(contentTextContract.parse('waitForMatch'));
          return Promise.resolve();
        }),
      });
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
  };
};
