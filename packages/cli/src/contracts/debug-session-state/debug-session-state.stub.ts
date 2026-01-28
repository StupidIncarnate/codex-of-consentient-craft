import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugSessionStateContract } from './debug-session-state-contract';
import type { DebugSessionState } from './debug-session-state-contract';
import { CliAppScreenStub } from '../cli-app-screen/cli-app-screen.stub';

export const DebugSessionStateStub = ({
  ...props
}: StubArgument<DebugSessionState> = {}): DebugSessionState =>
  debugSessionStateContract.parse({
    currentScreen: CliAppScreenStub(),
    isExited: false,
    ...props,
  });
