/**
 * PURPOSE: Processes a single debug command and sends the appropriate response
 *
 * USAGE:
 * await processDebugCommandLayerBroker({
 *   command,
 *   state,
 *   invocations,
 *   renderCapabilities,
 *   onResponse,
 * });
 * // Processes the command and calls onResponse with the result
 */
import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugSessionState } from '../../../contracts/debug-session-state/debug-session-state-contract';
import type { DebugSessionCallbackInvocations } from '../../../contracts/debug-session-callback-invocations/debug-session-callback-invocations-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { RenderCapabilities } from '../../../contracts/render-capabilities/render-capabilities-contract';
import { terminalFrameContract } from '../../../contracts/terminal-frame/terminal-frame-contract';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import { debugKeysStatics } from '../../../statics/debug-keys/debug-keys-statics';
import { buildDebugResponseTransformer } from '../../../transformers/build-debug-response/build-debug-response-transformer';
import { waitForRenderTransformer } from '../../../transformers/wait-for-render/wait-for-render-transformer';

export const processDebugCommandLayerBroker = async ({
  command,
  state,
  invocations,
  renderCapabilities,
  onResponse,
}: {
  command: DebugCommand;
  state: DebugSessionState;
  invocations: DebugSessionCallbackInvocations;
  renderCapabilities: RenderCapabilities;
  onResponse: (response: DebugResponse) => void;
}): Promise<void> => {
  if (state.isExited) {
    const frame = terminalFrameContract.parse('');
    const error = errorMessageContract.parse('Session already exited');
    onResponse(
      buildDebugResponseTransformer({
        success: false,
        error,
        frame,
        currentScreen: state.currentScreen,
        invocations,
      }),
    );
    return;
  }

  if (command.action === 'start') {
    await waitForRenderTransformer();
    const frame = renderCapabilities.getFrame();
    onResponse(
      buildDebugResponseTransformer({
        success: true,
        frame,
        currentScreen: state.currentScreen,
        invocations,
      }),
    );
    return;
  }

  if (command.action === 'input') {
    renderCapabilities.writeStdin(command.text);
    await waitForRenderTransformer();
    const frame = renderCapabilities.getFrame();
    onResponse(
      buildDebugResponseTransformer({
        success: true,
        frame,
        currentScreen: state.currentScreen,
        invocations,
      }),
    );
    return;
  }

  if (command.action === 'keypress') {
    const keyCode = debugKeysStatics.codes[command.key as keyof typeof debugKeysStatics.codes];
    renderCapabilities.writeStdin(keyCode);
    await waitForRenderTransformer();
    const frame = renderCapabilities.getFrame();
    onResponse(
      buildDebugResponseTransformer({
        success: true,
        frame,
        currentScreen: state.currentScreen,
        invocations,
      }),
    );
    return;
  }

  if (command.action === 'getScreen') {
    const frame = renderCapabilities.getFrame();
    onResponse(
      buildDebugResponseTransformer({
        success: true,
        frame,
        currentScreen: state.currentScreen,
        invocations,
      }),
    );
    return;
  }

  // Handle exit command (last remaining action type)
  renderCapabilities.unmount();
  state.isExited = true;
  const exitFrame = terminalFrameContract.parse('');
  onResponse(
    buildDebugResponseTransformer({
      success: true,
      frame: exitFrame,
      currentScreen: state.currentScreen,
      invocations,
    }),
  );
};
