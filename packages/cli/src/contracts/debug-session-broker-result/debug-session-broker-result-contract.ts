/**
 * PURPOSE: Defines the result from creating a debug session broker
 *
 * USAGE:
 * const result: DebugSessionBrokerResult = {
 *   handler,
 *   state,
 *   invocations,
 * };
 */

import { z } from 'zod';

import type { DebugSessionState } from '../debug-session-state/debug-session-state-contract';
import type { DebugSessionCallbackInvocations } from '../debug-session-callback-invocations/debug-session-callback-invocations-contract';
import type { CommandHandler } from '../command-handler/command-handler-contract';

export const debugSessionBrokerResultContract = z.object({
  handler: z.custom<CommandHandler>(),
  state: z.custom<DebugSessionState>(),
  invocations: z.custom<DebugSessionCallbackInvocations>(),
});

export type DebugSessionBrokerResult = z.infer<typeof debugSessionBrokerResultContract>;
