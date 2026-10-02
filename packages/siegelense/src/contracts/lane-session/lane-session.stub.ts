import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneSessionContract } from './lane-session-contract';
import type { LaneSession } from './lane-session-contract';
import { BrowserSessionStub } from '../browser-session/browser-session.stub';
import { PortPairStub } from '../port-pair/port-pair.stub';

export const LaneSessionStub = ({
  ...props
}: StubArgument<
  LaneSession,
  // A test proving `serverWindow` reads the byte count BEFORE and AFTER the verb runs needs two
  // successive `serverLogLength()` calls to answer differently — a single default value cannot
  // tell a collapsed-to-one-read regression from a correct implementation. One entry per call,
  // holding at the last entry once the sequence is exhausted rather than looping back to the
  // start — a call past the sequence's end should read as "still settled here", not "the log
  // shrank".
  { serverLogLengthSequence?: readonly number[] }
> = {}): LaneSession => {
  const {
    readServerLogSince,
    serverLogLength,
    serverLogLengthSequence,
    stopProcesses,
    startProcesses,
    ...dataProps
  } = props;

  let serverLogLengthCallCount = 0;
  const readOneFromSequence = (): number => {
    const sequence = serverLogLengthSequence ?? [];
    const entryIndex = Math.min(serverLogLengthCallCount, sequence.length - 1);
    serverLogLengthCallCount += 1;
    return sequence[entryIndex] ?? 0;
  };

  return {
    ...laneSessionContract.parse({
      specName: dataProps.specName === undefined ? 'dungeonmaster-stack' : dataProps.specName,
      ports: PortPairStub(dataProps.ports),
      homePath: dataProps.homePath ?? '/tmp/dm-siege-stub',
      evidencePath: dataProps.evidencePath ?? '/tmp/dm-siege-stub-evidence',
      repoRoot: dataProps.repoRoot ?? '/tmp/dm-siege-stub-repo',
      baseUrl: dataProps.baseUrl ?? 'http://127.0.0.1:0',
      apiBaseUrl: dataProps.apiBaseUrl ?? dataProps.baseUrl ?? 'http://127.0.0.1:0',
      pgids: dataProps.pgids === undefined ? [12345] : dataProps.pgids.map((value) => value),
      browser: dataProps.browser === null ? null : BrowserSessionStub(dataProps.browser),
      logFds: dataProps.logFds === undefined ? [] : dataProps.logFds.map((value) => value),
    }),
    readServerLogSince: readServerLogSince ?? ((): readonly string[] => []),
    serverLogLength:
      serverLogLength ??
      (serverLogLengthSequence === undefined ? (): number => 0 : readOneFromSequence),
    stopProcesses: stopProcesses ?? (async (): Promise<void> => Promise.resolve()),
    startProcesses: startProcesses ?? (async (): Promise<void> => Promise.resolve()),
  };
};
