import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugSessionInitResultContract } from './debug-session-init-result-contract';
import type { DebugSessionInitResult } from './debug-session-init-result-contract';
import { DebugSessionStateStub } from '../debug-session-state/debug-session-state.stub';
import { DebugSessionCallbackInvocationsStub } from '../debug-session-callback-invocations/debug-session-callback-invocations.stub';

export const DebugSessionInitResultStub = ({
  ...props
}: StubArgument<DebugSessionInitResult> = {}): DebugSessionInitResult =>
  debugSessionInitResultContract.parse({
    state: DebugSessionStateStub(),
    invocations: DebugSessionCallbackInvocationsStub(),
    ...props,
  });
