import type { StubArgument } from '@dungeonmaster/shared/@types';

import { bootFailureMarkerContract } from './boot-failure-marker-contract';
import type { BootFailureMarker } from './boot-failure-marker-contract';

export const BootFailureMarkerStub = ({
  ...props
}: StubArgument<BootFailureMarker> = {}): BootFailureMarker =>
  bootFailureMarkerContract.parse({
    message: 'the api process exited before opening its port',
    atMs: 1,
    ...props,
  });
