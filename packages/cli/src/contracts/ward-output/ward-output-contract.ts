/**
 * PURPOSE: Defines a branded string type for ward command output
 *
 * USAGE:
 * wardOutputContract.parse('No errors found');
 * // Returns: 'No errors found' as WardOutput
 */

import { z } from 'zod';

export const wardOutputContract = z.string().brand<'WardOutput'>();

export type WardOutput = z.infer<typeof wardOutputContract>;
