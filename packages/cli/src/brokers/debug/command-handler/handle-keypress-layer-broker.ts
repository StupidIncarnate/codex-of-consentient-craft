/**
 * PURPOSE: Handles the 'keypress' debug command - maps key name to escape code and writes to stdin
 *
 * USAGE:
 * const response = handleKeypressLayerBroker({
 *   command: DebugCommandKeypressStub({key: 'enter'}),
 *   renderResult
 * });
 * // Returns DebugResponse indicating success or error
 */

import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { DebugRenderResult } from '../../../contracts/debug-render-result/debug-render-result-contract';
import { debugResponseContract } from '../../../contracts/debug-response/debug-response-contract';
import { terminalFrameContract } from '../../../contracts/terminal-frame/terminal-frame-contract';
import { debugKeysStatics } from '../../../statics/debug-keys/debug-keys-statics';

type KeyCodeKey = keyof typeof debugKeysStatics.codes;

export const handleKeypressLayerBroker = ({
  command,
  renderResult,
}: {
  command: DebugCommand;
  renderResult: DebugRenderResult | undefined;
}): DebugResponse => {
  if (command.action !== 'keypress') {
    return debugResponseContract.parse({
      success: false,
      error: 'Invalid command action for keypress handler',
    });
  }

  if (renderResult === undefined) {
    return debugResponseContract.parse({
      success: false,
      error: 'Widget not rendered - cannot send keypress',
    });
  }

  const keyName = command.key as KeyCodeKey;
  const keyCode = debugKeysStatics.codes[keyName];

  renderResult.stdin.write(terminalFrameContract.parse(keyCode));

  return debugResponseContract.parse({
    success: true,
  });
};
