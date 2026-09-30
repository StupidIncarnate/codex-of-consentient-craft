/**
 * PURPOSE: Defines the data `staleReapLayerBroker` returns
 *
 * USAGE:
 * staleReapLayerResultContract.parse(value);
 * // Returns validated StaleReapLayerResult
 */
import { z } from '#gateway/npm/zod';
import { reapedInstanceContract } from '../reaped-instance/reaped-instance-contract';

export const staleReapLayerResultContract = z
  .object({
    reaped: reapedInstanceContract,
    portsReleased: z.array(z.number().brand<'StaleReapLayerResultPortsReleased'>()).readonly(),
  })
  .brand<'StaleReapLayerResult'>();

export type StaleReapLayerResult = z.infer<typeof staleReapLayerResultContract>;
