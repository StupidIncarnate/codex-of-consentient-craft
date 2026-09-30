/**
 * PURPOSE: Defines the DesignDecision structure for recording architectural choices
 *
 * USAGE:
 * designDecisionContract.parse({id: 'dd-uuid', title: 'Use JWT for auth', rationale: '...', relatedNodeIds: []});
 * // Returns: DesignDecision object
 */

import { z } from '#gateway/npm/zod';

import { flowNodeContract } from '../flow-node/flow-node-contract';

export const designDecisionContract = z.object({
  id: z.string().min(1).regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u).brand<'DesignDecisionId'>(),
  title: z.string().min(1).brand<'DesignDecisionTitle'>(),
  rationale: z.string().brand<'DesignDecisionRationale'>(),
  relatedNodeIds: z.array(flowNodeContract.shape.id),
}).brand<'DesignDecision'>();

export type DesignDecision = z.infer<typeof designDecisionContract>;
