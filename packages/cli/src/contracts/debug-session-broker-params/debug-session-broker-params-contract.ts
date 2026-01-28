/**
 * PURPOSE: Defines the parameters for the debug session broker
 *
 * USAGE:
 * const params: DebugSessionBrokerParams = {
 *   onCommand: (handler) => emitter.on('command', handler),
 *   onResponse: (response) => send(response),
 *   renderCapabilities,
 *   initialScreen: 'menu',
 * };
 */

import { z } from 'zod';

import type { DebugResponse } from '../debug-response/debug-response-contract';
import type { CommandHandler } from '../command-handler/command-handler-contract';
import type { RenderCapabilities } from '../render-capabilities/render-capabilities-contract';
import { cliAppScreenContract } from '../cli-app-screen/cli-app-screen-contract';

export const debugSessionBrokerParamsContract = z.object({
  onCommand: z.custom<(handler: CommandHandler) => void>(),
  onResponse: z.custom<(response: DebugResponse) => void>(),
  renderCapabilities: z.custom<RenderCapabilities>(),
  initialScreen: cliAppScreenContract,
});

export type DebugSessionBrokerParams = z.infer<typeof debugSessionBrokerParamsContract>;
