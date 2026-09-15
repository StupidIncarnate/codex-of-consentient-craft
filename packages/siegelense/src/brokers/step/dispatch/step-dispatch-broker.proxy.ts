import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { runVerbLayerBrokerProxy } from './run-verb-layer-broker.proxy';

const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const TWO_MATCHES_COUNT = 2;
const ONE_MATCH_COUNT = 1;
const FIXED_NOW_MS = 1_700_000_000_000;

export const stepDispatchBrokerProxy = (): {
  browserlessLane: (params: { specName: string }) => LaneSession;
  happyLane: () => { lane: LaneSession; captureCallArgs: () => readonly unknown[] };
  laneWithTwoMatches: () => { lane: LaneSession; clickMatchCallArgs: () => readonly unknown[] };
  laneRejectingClickMatch: (params: { error: Error }) => { lane: LaneSession };
} => {
  // Constructed for its own default behavior only to satisfy enforce-proxy-child-creation — this
  // proxy builds its own BrowserSession scenarios directly, so it is never addressed further. Same
  // pattern as lane-boot-broker.proxy.ts's own unaddressed child proxy constructions.
  runVerbLayerBrokerProxy();

  const dateHandle = registerSpyOn({ object: Date, method: 'now' });
  dateHandle.calledWith([]).returns(FIXED_NOW_MS);

  return {
    browserlessLane: ({ specName }: { specName: string }): LaneSession =>
      LaneSessionStub({ browser: null, specName }),

    happyLane: (): { lane: LaneSession; captureCallArgs: () => readonly unknown[] } => {
      const captureMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockResolvedValue(undefined),
          fillMatch: jest.fn().mockResolvedValue(undefined),
          waitForMatch: jest.fn().mockResolvedValue(undefined),
          capture: captureMock,
          evaluateSource: jest.fn().mockResolvedValue(contentTextContract.parse('"Guild Hall"')),
        },
      });
      return {
        lane,
        captureCallArgs: (): readonly unknown[] => captureMock.mock.calls,
      };
    },

    laneWithTwoMatches: (): { lane: LaneSession; clickMatchCallArgs: () => readonly unknown[] } => {
      const clickMatchMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(TWO_MATCHES_COUNT)),
          describeMatches: jest.fn().mockResolvedValue([]),
          clickMatch: clickMatchMock,
        },
      });
      return {
        lane,
        clickMatchCallArgs: (): readonly unknown[] => clickMatchMock.mock.calls,
      };
    },

    laneRejectingClickMatch: ({ error }: { error: Error }): { lane: LaneSession } => ({
      lane: LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockRejectedValue(error),
        },
      }),
    }),
  };
};
