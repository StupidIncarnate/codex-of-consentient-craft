/**
 * PURPOSE: Orchestrates debug command handling by delegating to appropriate layer brokers
 *
 * USAGE:
 * const response = debugCommandHandlerBroker({
 *   command: DebugCommandStartStub({screen: 'menu'}),
 *   renderResult,
 *   callbacks
 * });
 * // Returns DebugResponse based on command type
 */

import type { DebugCommand } from '../../../contracts/debug-command/debug-command-contract';
import type { DebugResponse } from '../../../contracts/debug-response/debug-response-contract';
import type { CallbackKey } from '../../../contracts/callback-key/callback-key-contract';
import type { DebugRenderResult } from '../../../contracts/debug-render-result/debug-render-result-contract';

import { handleStartLayerBroker } from './handle-start-layer-broker';
import { handleInputLayerBroker } from './handle-input-layer-broker';
import { handleKeypressLayerBroker } from './handle-keypress-layer-broker';
import { handleGetScreenLayerBroker } from './handle-get-screen-layer-broker';
import { handleExitLayerBroker } from './handle-exit-layer-broker';

type DebugCallbacksMap = Map<CallbackKey, unknown[]>;

export const debugCommandHandlerBroker = ({
  command,
  renderResult,
  callbacks,
}: {
  command: DebugCommand;
  renderResult: DebugRenderResult | undefined;
  callbacks: DebugCallbacksMap;
}): DebugResponse => {
  switch (command.action) {
    case 'start':
      return handleStartLayerBroker({
        command,
        renderResult,
        callbacks,
      });
    case 'input':
      return handleInputLayerBroker({
        command,
        renderResult,
      });
    case 'keypress':
      return handleKeypressLayerBroker({
        command,
        renderResult,
      });
    case 'getScreen':
      return handleGetScreenLayerBroker({
        command,
        renderResult,
        callbacks,
      });
    case 'exit':
      return handleExitLayerBroker({
        command,
        renderResult,
      });
    default: {
      const exhaustiveCheck: never = command;
      throw new Error(`Unhandled command action: ${String(exhaustiveCheck)}`);
    }
  }
};
