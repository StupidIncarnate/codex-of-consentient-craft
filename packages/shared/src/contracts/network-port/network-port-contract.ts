/**
 * PURPOSE: Defines a branded number type for network port values
 *
 * USAGE:
 * const port = networkPortContract.parse(5737);
 * // Returns branded NetworkPort number
 */

import { z } from 'zod';

const MIN_PORT = 1;
const MAX_PORT = 65_535;

export const networkPortContract = z
  .number()
  .int()
  .min(MIN_PORT)
  .max(MAX_PORT)
  .brand<'NetworkPort'>();

export type NetworkPort = z.infer<typeof networkPortContract>;
