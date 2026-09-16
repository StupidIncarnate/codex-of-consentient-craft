import { z } from 'zod';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { browserSessionContract } from './browser-session-contract';
import type { BrowserSession, BufferLengths, MatchCount } from './browser-session-contract';
import type { StepCandidate } from '../step-candidate/step-candidate-contract';

const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();

export const BrowserSessionStub = ({
  ...props
}: StubArgument<BrowserSession> = {}): BrowserSession => {
  const {
    goto,
    countMatches,
    describeMatches,
    nearestNames,
    clickMatch,
    fillMatch,
    waitForMatch,
    capture,
    evaluateSource,
    readConsoleSince,
    readNetworkSince,
    readWebsocketSince,
    bufferLengths,
    close,
    ...dataProps
  } = props;

  return {
    ...browserSessionContract.parse({ ...dataProps }),
    goto: goto ?? (async (): Promise<void> => Promise.resolve()),
    countMatches:
      countMatches ??
      (async (): Promise<MatchCount> => Promise.resolve(matchCountContract.parse(0))),
    describeMatches:
      describeMatches ?? (async (): Promise<readonly StepCandidate[]> => Promise.resolve([])),
    nearestNames:
      nearestNames ?? (async (): Promise<readonly ContentText[]> => Promise.resolve([])),
    clickMatch: clickMatch ?? (async (): Promise<void> => Promise.resolve()),
    fillMatch: fillMatch ?? (async (): Promise<void> => Promise.resolve()),
    waitForMatch: waitForMatch ?? (async (): Promise<void> => Promise.resolve()),
    capture: capture ?? (async (): Promise<void> => Promise.resolve()),
    evaluateSource:
      evaluateSource ??
      (async (): Promise<ContentText> => Promise.resolve(contentTextContract.parse(''))),
    readConsoleSince: readConsoleSince ?? ((): readonly ContentText[] => []),
    readNetworkSince: readNetworkSince ?? ((): readonly ContentText[] => []),
    readWebsocketSince: readWebsocketSince ?? ((): readonly ContentText[] => []),
    bufferLengths:
      bufferLengths ??
      ((): BufferLengths => ({
        consoleLines: bufferLineCountContract.parse(0),
        networkLines: bufferLineCountContract.parse(0),
        websocketLines: bufferLineCountContract.parse(0),
      })),
    close: close ?? (async (): Promise<void> => Promise.resolve()),
  };
};
