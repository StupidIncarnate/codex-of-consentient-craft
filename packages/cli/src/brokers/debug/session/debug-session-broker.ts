/**
 * PURPOSE: Initializes debug session state and invocations for command processing
 *
 * USAGE:
 * const { state, invocations } = debugSessionBroker({ initialScreen: 'menu' });
 * // Use with processDebugCommandLayerBroker to handle commands
 */
import type { CliAppScreen } from '../../../contracts/cli-app-screen/cli-app-screen-contract';
import type { DebugSessionInitResult } from '../../../contracts/debug-session-init-result/debug-session-init-result-contract';

export const debugSessionBroker = ({
  initialScreen,
}: {
  initialScreen: CliAppScreen;
}): DebugSessionInitResult => ({
  state: {
    currentScreen: initialScreen,
    isExited: false,
  },
  invocations: {
    onRunQuest: [],
    onExit: [],
  },
});
