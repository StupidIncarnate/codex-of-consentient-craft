/**
 * PURPOSE: Defines the parameters for starting a debug session
 *
 * USAGE:
 * const params: DebugSessionParams = {
 *   onCommand: (handler) => emitter.on('command', handler),
 *   onResponse: (response) => send(response),
 * };
 */

import { z } from 'zod';

import type { InstallContext } from '@dungeonmaster/shared/contracts';

import type { DebugResponse } from '../debug-response/debug-response-contract';
import type { CommandHandler } from '../command-handler/command-handler-contract';

export const debugSessionParamsContract = z.object({
  onCommand: z.custom<(handler: CommandHandler) => void>(),
  onResponse: z.custom<(response: DebugResponse) => void>(),
  installContext: z.custom<InstallContext>().optional(),
});

export type DebugSessionParams = z.infer<typeof debugSessionParamsContract>;
