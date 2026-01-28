/**
 * PURPOSE: Defines the mutable state for a debug session
 *
 * USAGE:
 * const state: DebugSessionState = {
 *   currentScreen: 'menu',
 *   isExited: false,
 * };
 */

import { z } from 'zod';

import { cliAppScreenContract } from '../cli-app-screen/cli-app-screen-contract';

export const debugSessionStateContract = z.object({
  currentScreen: cliAppScreenContract,
  isExited: z.boolean(),
});

export type DebugSessionState = z.infer<typeof debugSessionStateContract>;
