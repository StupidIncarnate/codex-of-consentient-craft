/**
 * PURPOSE: The parsed argv for `dungeonmaster siegelense compare` — one instance and the two runs
 * inside its own timeline to diff. Reach for this over `compareQueryContract`: that one is the
 * shape `compareReadBroker` reads off disk, this one is what `compareArgsParseTransformer` hands
 * back from `--instance`/`--run-a`/`--run-b`, and the two stay separate files because an argv layer
 * and a broker-query layer change for different reasons even when their fields agree today.
 *
 * USAGE:
 * compareArgsContract.parse({ instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5' });
 * // Returns a validated CompareArgs
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';

export const compareArgsContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    runA: siegeRunContract.shape.id,
    runB: siegeRunContract.shape.id,
    isJson: z.boolean().default(false),
  })
  .strict();

export type CompareArgs = z.infer<typeof compareArgsContract>;
