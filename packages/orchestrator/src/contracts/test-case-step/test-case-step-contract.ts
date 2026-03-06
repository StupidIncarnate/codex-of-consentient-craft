/**
 * PURPOSE: Defines the TestCaseStep structure for a single step in a generated test case path
 *
 * USAGE:
 * testCaseStepContract.parse({nodeId: 'login-page', nodeLabel: 'Login Page', nodeType: 'state', transition: null, assertions: []});
 * // Returns: TestCaseStep object
 */

import { z } from 'zod';
import {
  flowNodeIdContract,
  flowNodeTypeContract,
  outcomeTypeContract,
} from '@dungeonmaster/shared/contracts';

const testCaseAssertionContract = z.object({
  type: outcomeTypeContract,
  description: z.string().brand<'OutcomeDescription'>(),
});

export const testCaseStepContract = z.object({
  nodeId: flowNodeIdContract,
  nodeLabel: z.string().min(1).brand<'FlowNodeLabel'>(),
  nodeType: flowNodeTypeContract,
  transition: z.string().brand<'FlowEdgeLabel'>().nullable(),
  assertions: z.array(testCaseAssertionContract),
});

export type TestCaseStep = z.infer<typeof testCaseStepContract>;
