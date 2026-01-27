/**
 * PURPOSE: Defines the result structure from running npm run ward command
 *
 * USAGE:
 * wardRunResultContract.parse({success: true, output: '', errors: []});
 * // Returns: WardRunResult indicating ward passed or failed with errors
 */

import { z } from 'zod';

import { fileWorkUnitContract } from '../file-work-unit/file-work-unit-contract';
import { wardOutputContract } from '../ward-output/ward-output-contract';

export const wardRunResultContract = z.object({
  success: z.boolean(),
  output: wardOutputContract,
  errors: z.array(fileWorkUnitContract),
});

export type WardRunResult = z.infer<typeof wardRunResultContract>;
