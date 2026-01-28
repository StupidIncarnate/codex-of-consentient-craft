import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugSessionCallbackInvocationsContract } from './debug-session-callback-invocations-contract';
import type { DebugSessionCallbackInvocations } from './debug-session-callback-invocations-contract';

export const DebugSessionCallbackInvocationsStub = ({
  ...props
}: StubArgument<DebugSessionCallbackInvocations> = {}): DebugSessionCallbackInvocations =>
  debugSessionCallbackInvocationsContract.parse({
    onSpawnChaoswhisperer: [],
    onResumeChaoswhisperer: [],
    onRunQuest: [],
    onExit: [],
    ...props,
  });
