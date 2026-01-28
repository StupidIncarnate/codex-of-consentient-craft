/**
 * PURPOSE: Handles the 'start' debug command - validates render result and returns screen info
 *
 * USAGE:
 * const response = handleStartLayerBroker({
 *   command: DebugCommandStartStub({screen: 'menu'}),
 *   renderResult,
 *   callbacks
 * });
 * // Returns DebugResponse with screen info or error
 */

import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { CallbackKey } from '../../../contracts/callback-key/callback-key-contract';
import type { DebugRenderResult } from '../../../contracts/debug-render-result/debug-render-result-contract';
import { debugResponseContract } from '../../../contracts/debug-response/debug-response-contract';
import { terminalFrameContract } from '../../../contracts/terminal-frame/terminal-frame-contract';
import { screenNameContract } from '../../../contracts/screen-name/screen-name-contract';
import { callbackKeyContract } from '../../../contracts/callback-key/callback-key-contract';
import { frameToElementsTransformer } from '../../../transformers/frame-to-elements/frame-to-elements-transformer';

type DebugCallbacksMap = Map<CallbackKey, unknown[]>;

export const handleStartLayerBroker = ({
  command: _command,
  renderResult,
  callbacks,
}: {
  command: DebugCommand;
  renderResult: DebugRenderResult | undefined;
  callbacks: DebugCallbacksMap;
}): DebugResponse => {
  if (renderResult === undefined) {
    return debugResponseContract.parse({
      success: false,
      error: 'Widget not rendered - renderResult is undefined',
    });
  }

  const frame = renderResult.lastFrame() ?? '';
  const elements = frameToElementsTransformer({ frame });

  const callbacksRecord: Record<CallbackKey, unknown[]> = {};
  callbacks.forEach((value, key) => {
    callbacksRecord[callbackKeyContract.parse(key)] = value;
  });

  return debugResponseContract.parse({
    success: true,
    screen: {
      name: screenNameContract.parse('CliAppWidget'),
      frame: terminalFrameContract.parse(frame),
      elements,
    },
    callbacks: callbacksRecord,
  });
};
