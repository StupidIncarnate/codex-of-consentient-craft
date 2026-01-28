/**
 * PURPOSE: Defines the result structure for CLI debug mode responses
 *
 * USAGE:
 * const response = debugResponseContract.parse({
 *   success: true,
 *   screen: { name: 'MainScreen', frame: '...', elements: [] }
 * });
 * // Returns validated DebugResponse
 */

import { z } from 'zod';
import type { ScreenElement } from '../screen-element/screen-element-contract';
import { screenNameContract } from '../screen-name/screen-name-contract';
import { terminalFrameContract } from '../terminal-frame/terminal-frame-contract';
import { callbackKeyContract } from '../callback-key/callback-key-contract';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

export const debugResponseContract = z.object({
  success: z.boolean(),
  screen: z
    .object({
      name: screenNameContract,
      frame: terminalFrameContract,
      elements: z.custom<ScreenElement[]>(),
    })
    .optional(),
  callbacks: z.record(callbackKeyContract, z.array(z.unknown())).optional(),
  error: errorMessageContract.optional(),
});

export type DebugResponse = z.infer<typeof debugResponseContract>;
