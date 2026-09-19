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
import { StorageReadingStub } from '../storage-reading/storage-reading.stub';
import type { StorageReading } from '../storage-reading/storage-reading-contract';
import type { VideoActionStub } from '../video-action/video-action.stub';
import { VideoResultStub } from '../video-result/video-result.stub';

type VideoAction = ReturnType<typeof VideoActionStub>;
type VideoResult = ReturnType<typeof VideoResultStub>;

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
    pasteMatch,
    pasteRef,
    waitForPredicate,
    capture,
    captureLive,
    evaluateSource,
    readConsoleSince,
    readNetworkSince,
    readWebsocketSince,
    readDom,
    checkRootPresent,
    setViewport,
    addInitScript,
    readStorage,
    clearStorage,
    videoAction,
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
    pasteMatch: pasteMatch ?? (async (): Promise<void> => Promise.resolve()),
    pasteRef: pasteRef ?? (async (): Promise<void> => Promise.resolve()),
    waitForPredicate: waitForPredicate ?? (async (): Promise<void> => Promise.resolve()),
    capture: capture ?? (async (): Promise<void> => Promise.resolve()),
    captureLive: captureLive ?? (async (): Promise<void> => Promise.resolve()),
    evaluateSource:
      evaluateSource ??
      (async (): Promise<ContentText> => Promise.resolve(contentTextContract.parse(''))),
    readConsoleSince: readConsoleSince ?? ((): readonly ContentText[] => []),
    readNetworkSince: readNetworkSince ?? ((): readonly ContentText[] => []),
    readWebsocketSince: readWebsocketSince ?? ((): readonly ContentText[] => []),
    readDom: readDom ?? (async (): Promise<DomReading> => Promise.resolve(DomReadingStub())),
    checkRootPresent: checkRootPresent ?? (async (): Promise<boolean> => Promise.resolve(true)),
    setViewport: setViewport ?? (async (): Promise<void> => Promise.resolve()),
    addInitScript: addInitScript ?? (async (): Promise<void> => Promise.resolve()),
    readStorage:
      readStorage ?? (async (): Promise<StorageReading> => Promise.resolve(StorageReadingStub())),
    clearStorage: clearStorage ?? (async (): Promise<void> => Promise.resolve()),
    videoAction:
      videoAction ??
      (async ({ action }: { action: VideoAction }): Promise<VideoResult> =>
        Promise.resolve(
          VideoResultStub({
            status: action === 'start' ? 'started' : 'stopped',
            path: action === 'start' ? null : 'evidence/video',
          }),
        )),
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
