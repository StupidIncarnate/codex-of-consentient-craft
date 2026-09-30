/**
 * PURPOSE: Defines the siege instance object whose `id` every contract and function that holds one reuses
 *
 * USAGE:
 * siegeInstanceContract.parse({ id: 'inst_7f3a9c21' });
 * // Returns: SiegeInstance object
 */

import { z } from '#gateway/npm/zod';

export const siegeInstanceContract = z
  .object({
    id: z
      .string()
      .regex(
        /^inst_[0-9a-f]{4,}$/u,
        'Siege instance id must look like "inst_" followed by 4 or more lowercase hex characters, e.g. "inst_7f3a9c21"',
      )
      .brand<'SiegeInstanceId'>(),
  })
  .brand<'SiegeInstance'>();

export type SiegeInstance = z.infer<typeof siegeInstanceContract>;
