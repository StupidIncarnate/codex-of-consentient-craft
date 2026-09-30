import type { StubArgument } from '@dungeonmaster/shared/@types';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { bootFailureMarkerContract } from './boot-failure-marker-contract';
import type { BootFailureMarker } from './boot-failure-marker-contract';

export const BootFailureMarkerStub = ({
  ...props
}: StubArgument<BootFailureMarker> = {}): BootFailureMarker =>
  bootFailureMarkerContract.parse({
    message: 'the api process exited before opening its port',
    atMs: EpochMsStub(),
    ...props,
  });
