/**
 * PURPOSE: Validates captured snapshots of CLI screen output for E2E testing
 *
 * USAGE:
 * const state = e2eScreenStateContract.parse({ name: 'menu', frame: '...', capturedAt: Date.now() });
 * // Returns validated E2EScreenState with branded types
 */

import { z } from 'zod';
import { cliScreenNameContract } from '../cli-screen-name/cli-screen-name-contract';
import { screenFrameContract } from '../screen-frame/screen-frame-contract';

export const e2eScreenStateContract = z.object({
  name: cliScreenNameContract,
  frame: screenFrameContract,
  capturedAt: z.number().int().positive().brand<'Timestamp'>(),
});

export type E2EScreenState = z.infer<typeof e2eScreenStateContract>;
