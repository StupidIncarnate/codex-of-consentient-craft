import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { stepClickBrokerProxy } from '../click/step-click-broker.proxy';
import { stepEvalSourceBrokerProxy } from '../eval-source/step-eval-source-broker.proxy';
import { stepGotoBrokerProxy } from '../goto/step-goto-broker.proxy';
import { stepScreenshotBrokerProxy } from '../screenshot/step-screenshot-broker.proxy';
import { stepTargetResolveBrokerProxy } from '../target-resolve/step-target-resolve-broker.proxy';
import { stepTypeBrokerProxy } from '../type/step-type-broker.proxy';
import { stepWaitForBrokerProxy } from '../wait-for/step-wait-for-broker.proxy';

// browserSessionContract carries no MatchCount export of its own (contracts/ exposes only the
// inferred type) — the same local re-declaration step-target-resolve-broker.proxy.ts already uses.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const TWO_MATCHES_COUNT = 2;

export const runVerbLayerBrokerProxy = (): {
  sessionWithOneMatch: () => {
    session: BrowserSession;
    callOrder: () => readonly ContentText[];
  };
  sessionWithTwoMatches: () => { session: BrowserSession };
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

  return {
    sessionWithOneMatch: (): {
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
      return { session, callOrder: (): readonly ContentText[] => order };
    },

    sessionWithTwoMatches: (): { session: BrowserSession } => ({
      session: BrowserSessionStub({
        countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(TWO_MATCHES_COUNT)),
        describeMatches: jest.fn().mockResolvedValue([]),
        clickMatch: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  };
};
