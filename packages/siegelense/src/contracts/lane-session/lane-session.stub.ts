import type { StubArgument } from '@dungeonmaster/shared/@types';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { laneSessionContract } from './lane-session-contract';
import type { LaneSession } from './lane-session-contract';
import { BrowserSessionStub } from '../browser-session/browser-session.stub';
import { fileDescriptorContract } from '../file-descriptor/file-descriptor-contract';
import { PortPairStub } from '../port-pair/port-pair.stub';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';
import { ProcessGroupIdStub } from '../process-group-id/process-group-id.stub';
import { serverLogByteCountContract } from '../server-log-byte-count/server-log-byte-count-contract';
import type { ServerLogByteCount } from '../server-log-byte-count/server-log-byte-count-contract';
import { SpecNameStub } from '../spec-name/spec-name.stub';

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
  const { readServerLogSince, serverLogLength, serverLogLengthSequence, ...dataProps } = props;

  let serverLogLengthCallCount = 0;
  const readOneFromSequence = (): ServerLogByteCount => {
    const sequence = serverLogLengthSequence ?? [];
    const entryIndex = Math.min(serverLogLengthCallCount, sequence.length - 1);
    serverLogLengthCallCount += 1;
    return serverLogByteCountContract.parse(sequence[entryIndex]);
  };

  return {
    ...laneSessionContract.parse({}),
    specName:
      dataProps.specName === undefined
        ? SpecNameStub()
        : SpecNameStub({ value: dataProps.specName }),
    ports: PortPairStub(dataProps.ports),
    homePath: absoluteFilePathContract.parse(dataProps.homePath ?? '/tmp/dm-siege-stub'),
    evidencePath: absoluteFilePathContract.parse(
      dataProps.evidencePath ?? '/tmp/dm-siege-stub-evidence',
    ),
    baseUrl: contentTextContract.parse(dataProps.baseUrl ?? 'http://127.0.0.1:0'),
    apiBaseUrl: contentTextContract.parse(
      dataProps.apiBaseUrl ?? dataProps.baseUrl ?? 'http://127.0.0.1:0',
    ),
    pgids:
      dataProps.pgids === undefined
        ? [ProcessGroupIdStub()]
        : dataProps.pgids.map((value) => processGroupIdContract.parse(value)),
    browser: dataProps.browser === null ? null : BrowserSessionStub(dataProps.browser),
    logFds:
      dataProps.logFds === undefined
        ? []
        : dataProps.logFds.map((value) => fileDescriptorContract.parse(value)),
    readServerLogSince: readServerLogSince ?? ((): readonly ContentText[] => []),
    serverLogLength:
      serverLogLength ??
      (serverLogLengthSequence === undefined
        ? (): ServerLogByteCount => serverLogByteCountContract.parse(0)
        : readOneFromSequence),
  };
};
