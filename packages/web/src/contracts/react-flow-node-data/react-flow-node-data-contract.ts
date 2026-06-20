/**
 * PURPOSE: Defines the data shape for a React Flow node in the flow graph visualizer
 *
 * USAGE:
 * reactFlowNodeDataContract.parse({ nodeId: 'login-page', label: 'Login Page', nodeType: 'state', observableCount: 3 });
 * // Returns: ReactFlowNodeData with branded fields
 */

import { z } from 'zod';

import { flowNodeIdContract, flowNodeTypeContract } from '@dungeonmaster/shared/contracts';

import { observableCountContract } from '../observable-count/observable-count-contract';

export const reactFlowNodeDataContract = z.object({
  nodeId: flowNodeIdContract,
  label: z.string().min(1).brand<'FlowNodeLabel'>(),
  nodeType: flowNodeTypeContract,
  observableCount: observableCountContract,
});

export type ReactFlowNodeData = z.infer<typeof reactFlowNodeDataContract>;
