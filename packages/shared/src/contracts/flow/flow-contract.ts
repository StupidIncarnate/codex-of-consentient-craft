/**
 * PURPOSE: Defines the Flow structure for user journey sequences through a quest
 *
 * USAGE:
 * flowContract.parse({id: 'uuid', name: 'Login Flow', flowType: 'runtime', entryPoint: '/login', exitPoints: ['/dashboard'], nodes: [], edges: []});
 * // Returns: Flow object
 *
 * `offMapSignoffs` is an ID-BEARING ARRAY keyed on the off-map probe family, not a
 * `Record<QaOffMapFamily, ...>`. `questItemDeepMergeTransformer` recurses into arrays of id-bearing
 * objects and upserts by `id`, but replaces a plain object value WHOLESALE — so a `Record` would
 * erase every other family's sign-offs on each single-family write. A `Record` keyed on the closed
 * family enum also breaks outright the moment a seventh family lands, because every persisted flow
 * would be missing the new key; the array simply grows.
 */

import { z } from 'zod';

import { flowEdgeContract } from '../flow-edge/flow-edge-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';
import { flowOffMapSignoffContract } from '../flow-off-map-signoff/flow-off-map-signoff-contract';
import { flowTypeContract } from '../flow-type/flow-type-contract';

export const flowContract = z.object({
  id: flowIdContract,
  name: z.string().min(1).brand<'FlowName'>(),
  flowType: flowTypeContract,
  scope: z.string().brand<'FlowScope'>().optional(),
  entryPoint: z.string().min(1).brand<'FlowEntryPoint'>(),
  exitPoints: z.array(z.string().min(1).brand<'FlowExitPoint'>()).min(1),
  nodes: z.array(flowNodeContract).default([]),
  edges: z.array(flowEdgeContract).default([]),
  offMapSignoffs: z.array(flowOffMapSignoffContract).default([]),
});

export type Flow = z.infer<typeof flowContract>;
