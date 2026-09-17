/**
 * PURPOSE: What `dungeonmaster siegelense capacity`'s argv parses down to — which spec to price, and
 * the pool size whose sample group to read. Reach for this over passing two loose values: the pair
 * travels together from the flow through the responder into the broker, and `poolSize` is the field
 * that decides WHICH measured group the division uses (siegelense-tooling.md line 2526).
 *
 * Both are `.nullable()` rather than absent-able: an omitted flag means "use the knob"
 * (`capacityStatics.defaults.specName`, `capacityStatics.policy.ceiling`), and under this repo's
 * `exactOptionalPropertyTypes` an absent key and an explicit `null` are different values — a
 * nullable field keeps the parsed shape and the argv shape the same thing.
 *
 * USAGE:
 * capacityArgsContract.parse({ specName: null, poolSize: null });
 * // Returns a validated CapacityArgs — the bare `capacity` form
 */

import { z } from 'zod';

import { profilePoolSizeContract } from '../profile-pool-size/profile-pool-size-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const capacityArgsContract = z
  .object({
    specName: specNameContract.nullable(),
    poolSize: profilePoolSizeContract.nullable(),
  })
  .strict();

export type CapacityArgs = z.infer<typeof capacityArgsContract>;
