/**
 * PURPOSE: Handles the 'input' debug command - writes text to stdin
 *
 * USAGE:
 * const response = handleInputLayerBroker({
 *   command: DebugCommandInputStub({text: 'hello'}),
 *   renderResult
 * });
 * // Returns DebugResponse indicating success or error
 */

import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { DebugRenderResult } from '../../../contracts/debug-render-result/debug-render-result-contract';
import { debugResponseContract } from '../../../contracts/debug-response/debug-response-contract';
import { terminalFrameContract } from '../../../contracts/terminal-frame/terminal-frame-contract';

export const handleInputLayerBroker = ({
  command,
  renderResult,
}: {
  command: DebugCommand;
  renderResult: DebugRenderResult | undefined;
}): DebugResponse => {
  if (command.action !== 'input') {
    return debugResponseContract.parse({
      success: false,
      error: 'Invalid command action for input handler',
    });
  }

  if (renderResult === undefined) {
    return debugResponseContract.parse({
      success: false,
      error: 'Widget not rendered - cannot write input',
    });
  }

  renderResult.stdin.write(terminalFrameContract.parse(command.text));

  return debugResponseContract.parse({
    success: true,
  });
};
