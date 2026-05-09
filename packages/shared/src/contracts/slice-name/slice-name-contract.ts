/**
 * PURPOSE: Defines a branded kebab-case string type for quest slice names
 *
 * USAGE:
 * sliceNameContract.parse('backend');
 * // Returns: SliceName branded string used to tag steps and identify slice ownership
 */

import { z } from 'zod';

export const sliceNameContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'SliceName'>();

export type SliceName = z.infer<typeof sliceNameContract>;
