/**
 * PURPOSE: What `dungeonmaster siegelense capacity`'s argv parses down to — which spec to price,
 * the pool size whose sample group to read, and whether to output raw JSON rather than the default
 * human summary. Reach for this over passing loose values: the tuple travels together from the flow
 * through the responder into the broker.
 *
 * Both `specName` and `poolSize` are `.nullable()` rather than absent-able: an omitted flag means
 * "use the knob" (`capacityStatics.defaults.specName`, `capacityStatics.policy.ceiling`). `isJson`
 * defaults to false (human output by default).
 *
 * USAGE:
 * capacityArgsContract.parse({ specName: null, poolSize: null, isJson: false });
 * // Returns a validated CapacityArgs — the bare `capacity` form
 */

import { z } from 'zod';

import { profilePoolSizeContract } from '../profile-pool-size/profile-pool-size-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const capacityArgsContract = z
  .object({
    specName: specNameContract.nullable(),
    poolSize: profilePoolSizeContract.nullable(),
    isJson: z.boolean().default(false),
  })
  .strict();

export type CapacityArgs = z.infer<typeof capacityArgsContract>;
