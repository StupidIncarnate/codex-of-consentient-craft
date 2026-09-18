import { z } from 'zod';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { browserSessionContract } from './browser-session-contract';
import type { BrowserSession, BufferLengths, MatchCount } from './browser-session-contract';
import { BoxReadingStub } from '../box-reading/box-reading.stub';
import type { BoxReading } from '../box-reading/box-reading-contract';
import { DomReadingStub } from '../dom-reading/dom-reading.stub';
import type { DomReading } from '../dom-reading/dom-reading-contract';
import { KeyListingStub } from '../key-listing/key-listing.stub';
import type { KeyListing } from '../key-listing/key-listing-contract';
import { KeyReadingStub } from '../key-reading/key-reading.stub';
import type { KeyReading } from '../key-reading/key-reading-contract';
import { RefResolutionStub } from '../ref-resolution/ref-resolution.stub';
import type { RefResolution } from '../ref-resolution/ref-resolution-contract';
import type { StepCandidate } from '../step-candidate/step-candidate-contract';

const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();

export const BrowserSessionStub = ({
  ...props
}: StubArgument<BrowserSession> = {}): BrowserSession => {
  const {
    goto,
    look,
    refState,
    countMatches,
    describeMatches,
    nearestNames,
    clickMatch,
    clickRef,
    fillRef,
    boxRef,
    pressKey,
    fillMatch,
    waitForMatch,
    waitForPredicate,
    capture,
    evaluateSource,
    readConsoleSince,
    readNetworkSince,
    readWebsocketSince,
    readDom,
    bufferLengths,
    close,
    ...dataProps
  } = props;

  return {
    ...browserSessionContract.parse({ ...dataProps }),
    goto: goto ?? (async (): Promise<void> => Promise.resolve()),
    look: look ?? (async (): Promise<KeyListing> => Promise.resolve(KeyListingStub())),
    refState:
      refState ?? (async (): Promise<RefResolution> => Promise.resolve(RefResolutionStub())),
    countMatches:
      countMatches ??
      (async (): Promise<MatchCount> => Promise.resolve(matchCountContract.parse(0))),
    describeMatches:
      describeMatches ?? (async (): Promise<readonly StepCandidate[]> => Promise.resolve([])),
    nearestNames:
      nearestNames ?? (async (): Promise<readonly ContentText[]> => Promise.resolve([])),
    clickMatch: clickMatch ?? (async (): Promise<void> => Promise.resolve()),
    clickRef: clickRef ?? (async (): Promise<void> => Promise.resolve()),
    fillRef: fillRef ?? (async (): Promise<void> => Promise.resolve()),
    boxRef: boxRef ?? (async (): Promise<BoxReading> => Promise.resolve(BoxReadingStub())),
    pressKey: pressKey ?? (async (): Promise<KeyReading> => Promise.resolve(KeyReadingStub())),
    fillMatch: fillMatch ?? (async (): Promise<void> => Promise.resolve()),
    waitForMatch: waitForMatch ?? (async (): Promise<void> => Promise.resolve()),
    waitForPredicate: waitForPredicate ?? (async (): Promise<void> => Promise.resolve()),
    capture: capture ?? (async (): Promise<void> => Promise.resolve()),
    evaluateSource:
      evaluateSource ??
      (async (): Promise<ContentText> => Promise.resolve(contentTextContract.parse(''))),
    readConsoleSince: readConsoleSince ?? ((): readonly ContentText[] => []),
    readNetworkSince: readNetworkSince ?? ((): readonly ContentText[] => []),
    readWebsocketSince: readWebsocketSince ?? ((): readonly ContentText[] => []),
    readDom: readDom ?? (async (): Promise<DomReading> => Promise.resolve(DomReadingStub())),
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
