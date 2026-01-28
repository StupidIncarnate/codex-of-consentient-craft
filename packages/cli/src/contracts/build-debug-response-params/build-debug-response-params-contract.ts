/**
 * PURPOSE: Defines the parameters for building a debug response
 *
 * USAGE:
 * const params: BuildDebugResponseParams = {
 *   success: true,
 *   frame: '> Menu',
 *   currentScreen: 'menu',
 *   invocations,
 * };
 */

import { z } from 'zod';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { cliAppScreenContract } from '../cli-app-screen/cli-app-screen-contract';
import { debugSessionCallbackInvocationsContract } from '../debug-session-callback-invocations/debug-session-callback-invocations-contract';
import { terminalFrameContract } from '../terminal-frame/terminal-frame-contract';

export const buildDebugResponseParamsContract = z.object({
  success: z.boolean(),
  error: errorMessageContract.optional(),
  frame: terminalFrameContract,
  currentScreen: cliAppScreenContract,
  invocations: debugSessionCallbackInvocationsContract,
});

export type BuildDebugResponseParams = z.infer<typeof buildDebugResponseParamsContract>;
