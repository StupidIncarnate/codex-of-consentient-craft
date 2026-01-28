/**
 * PURPOSE: Defines the result from initializing a debug session
 *
 * USAGE:
 * const result: DebugSessionInitResult = { state, invocations };
 */

import { z } from 'zod';

import type { DebugSessionState } from '../debug-session-state/debug-session-state-contract';
import type { DebugSessionCallbackInvocations } from '../debug-session-callback-invocations/debug-session-callback-invocations-contract';

export const debugSessionInitResultContract = z.object({
  state: z.custom<DebugSessionState>(),
  invocations: z.custom<DebugSessionCallbackInvocations>(),
});

export type DebugSessionInitResult = z.infer<typeof debugSessionInitResultContract>;
