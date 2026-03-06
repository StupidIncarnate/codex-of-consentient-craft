/**
 * PURPOSE: Defines the TestCase structure for a generated test case from flow graph traversal
 *
 * USAGE:
 * testCaseContract.parse({id: 'uuid', flowId: 'uuid', terminalNodeId: 'end-state', steps: []});
 * // Returns: TestCase object
 */

import { z } from 'zod';
import { flowIdContract, flowNodeIdContract } from '@dungeonmaster/shared/contracts';

import { testCaseIdContract } from '../test-case-id/test-case-id-contract';
import { testCaseStepContract } from '../test-case-step/test-case-step-contract';

export const testCaseContract = z.object({
  id: testCaseIdContract,
  flowId: flowIdContract,
  terminalNodeId: flowNodeIdContract,
  steps: z.array(testCaseStepContract),
});

export type TestCase = z.infer<typeof testCaseContract>;
