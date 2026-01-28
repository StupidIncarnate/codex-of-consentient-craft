import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugSessionBrokerResultContract } from './debug-session-broker-result-contract';
import type { DebugSessionBrokerResult } from './debug-session-broker-result-contract';
import { CommandHandlerStub } from '../command-handler/command-handler.stub';
import { DebugSessionStateStub } from '../debug-session-state/debug-session-state.stub';
import { DebugSessionCallbackInvocationsStub } from '../debug-session-callback-invocations/debug-session-callback-invocations.stub';

export const DebugSessionBrokerResultStub = ({
  ...props
}: StubArgument<DebugSessionBrokerResult> = {}): DebugSessionBrokerResult =>
  debugSessionBrokerResultContract.parse({
    handler: CommandHandlerStub(),
    state: DebugSessionStateStub(),
    invocations: DebugSessionCallbackInvocationsStub(),
    ...props,
  });
