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

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { runIdContract } from '../run-id/run-id-contract';

export const compareArgsContract = z
  .object({
    instanceId: instanceIdContract,
    runA: runIdContract,
    runB: runIdContract,
    json: z.boolean().default(false),
  })
  .strict();

export type CompareArgs = z.infer<typeof compareArgsContract>;
