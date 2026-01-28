import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstallContextStub } from '@dungeonmaster/shared/contracts';

import { debugSessionParamsContract } from './debug-session-params-contract';
import type { DebugSessionParams } from './debug-session-params-contract';

export const DebugSessionParamsStub = ({
  ...props
}: StubArgument<DebugSessionParams> = {}): DebugSessionParams =>
  debugSessionParamsContract.parse({
    onCommand: (): void => {
      // No-op
    },
    onResponse: (): void => {
      // No-op
    },
    installContext: InstallContextStub({
      value: {
        targetProjectRoot: '/test/project',
        dungeonmasterRoot: '/test/dungeonmaster',
      },
    }),
    ...props,
  });
