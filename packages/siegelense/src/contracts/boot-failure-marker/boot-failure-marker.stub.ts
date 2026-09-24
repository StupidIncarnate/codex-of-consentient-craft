import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { bootFailureMarkerContract } from './boot-failure-marker-contract';
import type { BootFailureMarker } from './boot-failure-marker-contract';

export const BootFailureMarkerStub = ({
  ...props
}: StubArgument<BootFailureMarker> = {}): BootFailureMarker =>
  bootFailureMarkerContract.parse({
    message: ContentTextStub({
      value: 'the api process exited before opening its port',
    }),
    atMs: EpochMsStub(),
    ...props,
  });
