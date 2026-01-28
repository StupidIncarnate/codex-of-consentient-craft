import type { StubArgument } from '@dungeonmaster/shared/@types';

import { buildDebugResponseParamsContract } from './build-debug-response-params-contract';
import type { BuildDebugResponseParams } from './build-debug-response-params-contract';
import { CliAppScreenStub } from '../cli-app-screen/cli-app-screen.stub';
import { DebugSessionCallbackInvocationsStub } from '../debug-session-callback-invocations/debug-session-callback-invocations.stub';
import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';

export const BuildDebugResponseParamsStub = ({
  ...props
}: StubArgument<BuildDebugResponseParams> = {}): BuildDebugResponseParams =>
  buildDebugResponseParamsContract.parse({
    success: true,
    frame: TerminalFrameStub(),
    currentScreen: CliAppScreenStub(),
    invocations: DebugSessionCallbackInvocationsStub(),
    ...props,
  });
