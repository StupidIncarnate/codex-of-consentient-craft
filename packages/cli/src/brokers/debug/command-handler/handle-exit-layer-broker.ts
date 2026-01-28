/**
 * PURPOSE: Handles the 'exit' debug command - unmounts the widget and cleans up
 *
 * USAGE:
 * const response = handleExitLayerBroker({
 *   command: DebugCommandExitStub(),
 *   renderResult
 * });
 * // Returns DebugResponse indicating success
 */

import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { DebugRenderResult } from '../../../contracts/debug-render-result/debug-render-result-contract';
import { debugResponseContract } from '../../../contracts/debug-response/debug-response-contract';

export const handleExitLayerBroker = ({
  command: _command,
  renderResult,
}: {
  command: DebugCommand;
  renderResult: DebugRenderResult | undefined;
}): DebugResponse => {
  if (renderResult === undefined) {
    return debugResponseContract.parse({
      success: true,
    });
  }

  renderResult.unmount();

  return debugResponseContract.parse({
    success: true,
  });
};
