/**
 * PURPOSE: Defines the FlowEdge structure for edges connecting flow nodes
 *
 * USAGE:
 * flowEdgeContract.parse({id: 'login-to-dashboard', from: 'login-page', to: 'dashboard', label: 'success'});
 * // Returns: FlowEdge object
 */

import { z } from 'zod';

import { flowEdgeIdContract } from '../flow-edge-id/flow-edge-id-contract';
import { flowEdgeRefContract } from '../flow-edge-ref/flow-edge-ref-contract';

export const flowEdgeContract = z.object({
  id: flowEdgeIdContract,
  from: flowEdgeRefContract,
  to: flowEdgeRefContract,
  label: z.string().brand<'FlowEdgeLabel'>().optional(),
});

export type FlowEdge = z.infer<typeof flowEdgeContract>;
