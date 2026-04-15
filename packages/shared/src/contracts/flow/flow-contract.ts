/**
 * PURPOSE: Defines the Flow structure for user journey sequences through a quest
 *
 * USAGE:
 * flowContract.parse({id: 'uuid', name: 'Login Flow', flowType: 'runtime', entryPoint: '/login', exitPoints: ['/dashboard'], nodes: [], edges: []});
 * // Returns: Flow object
 */

import { z } from 'zod';

import { flowEdgeContract } from '../flow-edge/flow-edge-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';
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
});

export type Flow = z.infer<typeof flowContract>;
