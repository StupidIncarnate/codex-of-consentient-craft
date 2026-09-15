import { z } from 'zod';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { laneSessionContract } from './lane-session-contract';
import type { LaneSession } from './lane-session-contract';
import { BrowserSessionStub } from '../browser-session/browser-session.stub';
import { PortPairStub } from '../port-pair/port-pair.stub';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';
import { ProcessGroupIdStub } from '../process-group-id/process-group-id.stub';
import { SpecNameStub } from '../spec-name/spec-name.stub';

const serverLogByteCountContract = z.number().int().nonnegative().brand<'ServerLogByteCount'>();
type ServerLogByteCount = z.infer<typeof serverLogByteCountContract>;

export const LaneSessionStub = ({ ...props }: StubArgument<LaneSession> = {}): LaneSession => {
  const { readServerLogSince, serverLogLength, ...dataProps } = props;

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
    pgids:
      dataProps.pgids === undefined
        ? [ProcessGroupIdStub()]
        : dataProps.pgids.map((value) => processGroupIdContract.parse(value)),
    browser: dataProps.browser === null ? null : BrowserSessionStub(dataProps.browser),
    readServerLogSince: readServerLogSince ?? ((): readonly ContentText[] => []),
    serverLogLength:
      serverLogLength ?? ((): ServerLogByteCount => serverLogByteCountContract.parse(0)),
  };
};
