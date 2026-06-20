/**
 * PURPOSE: Defines the position map output of the ELK layout adapter — one {x, y} entry per node id
 *
 * USAGE:
 * elkPositionMapContract.parse({ 'login-page': { x: 0, y: 0 }, 'dashboard': { x: 180, y: 120 } });
 * // Returns: ElkPositionMap with branded x/y values keyed by node id string
 */

import { z } from 'zod';

const elkPositionXContract = z.number().brand<'ElkPositionX'>();
const elkPositionYContract = z.number().brand<'ElkPositionY'>();

const elkPositionEntryContract = z.object({
  x: elkPositionXContract,
  y: elkPositionYContract,
});

export const elkPositionMapContract = z
  .record(z.string(), elkPositionEntryContract)
  .brand<'ElkPositionMap'>();

export type ElkPositionMap = z.infer<typeof elkPositionMapContract>;
export type ElkPositionEntry = z.infer<typeof elkPositionEntryContract>;
export type ElkPositionX = z.infer<typeof elkPositionXContract>;
export type ElkPositionY = z.infer<typeof elkPositionYContract>;
