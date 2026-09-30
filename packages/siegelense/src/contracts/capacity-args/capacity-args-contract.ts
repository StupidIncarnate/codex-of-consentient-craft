/**
 * PURPOSE: What `dungeonmaster siegelense capacity`'s argv parses down to — which spec to price,
 * the pool size whose sample group to read, and whether to output raw JSON rather than the default
 * human summary. Reach for this over passing loose values: the tuple travels together from the flow
 * through the responder into the broker.
 *
 * `specName` is required: capacity calculation depends on spec footprint. `poolSize` is `.nullable()`
 * rather than absent-able: an omitted flag means "use the policy ceiling" (`capacityStatics.policy.ceiling`).
 * `isJson` defaults to false (human output by default).
 *
 * USAGE:
 * capacityArgsContract.parse({ specName: 'dungeonmaster-stack', poolSize: null, isJson: false });
 * // Returns a validated CapacityArgs
 */

import { z } from '#gateway/npm/zod';


export const capacityArgsContract = z
  .object({
    specName: z.string().min(1).brand<'CapacityArgsSpecName'>(),
    poolSize: z.number().int().positive().brand<'CapacityArgsPoolSize'>().nullable(),
    isJson: z.boolean().default(false),
  })
  .strict();

export type CapacityArgs = z.infer<typeof capacityArgsContract>;
