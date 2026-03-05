/**
 * PURPOSE: Defines the FlowNode structure for nodes in a flow graph
 *
 * USAGE:
 * flowNodeContract.parse({id: 'login-page', label: 'Login Page', type: 'state', observables: []});
 * // Returns: FlowNode object
 */

import { z } from 'zod';

import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowNodeTypeContract } from '../flow-node-type/flow-node-type-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';

export const flowNodeContract = z.object({
  id: flowNodeIdContract,
  label: z.string().min(1).brand<'FlowNodeLabel'>(),
  type: flowNodeTypeContract,
  observables: z.array(flowObservableContract).default([]),
});

export type FlowNode = z.infer<typeof flowNodeContract>;
