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
      value:
        'Lane spec dungeonmaster-web requires a fake agent CLI, and the environment supplies none of it: set CLAUDE_CLI_PATH to a stub Claude CLI binary; set WARD_CLI_PATH to a stub dungeonmaster-ward CLI binary.',
    }),
    atMs: EpochMsStub(),
    ...props,
  });
