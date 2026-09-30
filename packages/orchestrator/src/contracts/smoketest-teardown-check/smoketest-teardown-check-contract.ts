/**
 * PURPOSE: Discriminated union describing a post-case teardown verification (siegemaster dev-server cleanup checks)
 *
 * USAGE:
 * smoketestTeardownCheckContract.parse({ kind: 'port-free', port: 4751 });
 * // Returns: SmoketestTeardownCheck (variant: port-free)
 */

import { z } from '#gateway/npm/zod';

import { networkPortStatics } from '../../statics/network-port/network-port-statics';

const portFreeCheckContract = z
  .object({
    kind: z.literal('port-free'),
    port: z
      .number()
      .int()
      .min(networkPortStatics.min)
      .max(networkPortStatics.max)
      .brand<'PortFreeCheckPort'>(),
  })
  .brand<'PortFreeCheck'>();

const processGoneCheckContract = z
  .object({
    kind: z.literal('process-gone'),
    pid: z.number().int().positive().brand<'ProcessGoneCheckPid'>(),
  })
  .brand<'ProcessGoneCheck'>();

export const smoketestTeardownCheckContract = z.discriminatedUnion('kind', [
  portFreeCheckContract,
  processGoneCheckContract,
]);

export type SmoketestTeardownCheck = z.infer<typeof smoketestTeardownCheckContract>;
