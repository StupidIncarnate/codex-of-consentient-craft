/**
 * PURPOSE: Defines the CollectedPath and PathStep structures for DFS traversal results of flow graphs
 *
 * USAGE:
 * collectedPathContract.parse({steps: [{nodeId: 'start', transition: null}], terminalNodeId: 'end'});
 * // Returns: CollectedPath object
 */

import { z } from 'zod';
import { flowNodeIdContract } from '@dungeonmaster/shared/contracts';

import { testCaseStepContract } from '../test-case-step/test-case-step-contract';

const pathStepContract = z.object({
  nodeId: flowNodeIdContract,
  transition: testCaseStepContract.shape.transition,
});

export const collectedPathContract = z.object({
  steps: z.array(pathStepContract),
  terminalNodeId: flowNodeIdContract,
});

export type PathStep = z.infer<typeof pathStepContract>;
export type CollectedPath = z.infer<typeof collectedPathContract>;
