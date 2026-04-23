/**
 * PURPOSE: Discriminated union describing a post-case teardown verification (siegemaster dev-server cleanup checks)
 *
 * USAGE:
 * smoketestTeardownCheckContract.parse({ kind: 'port-free', port: 4751 });
 * // Returns: SmoketestTeardownCheck (variant: port-free)
 */

import { z } from 'zod';

import { networkPortContract } from '@dungeonmaster/shared/contracts';

import { processPidContract } from '../process-pid/process-pid-contract';

const portFreeCheckContract = z.object({
  kind: z.literal('port-free'),
  port: networkPortContract,
});

const processGoneCheckContract = z.object({
  kind: z.literal('process-gone'),
  pid: processPidContract,
});

export const smoketestTeardownCheckContract = z.discriminatedUnion('kind', [
  portFreeCheckContract,
  processGoneCheckContract,
]);

export type SmoketestTeardownCheck = z.infer<typeof smoketestTeardownCheckContract>;
