/**
 * PURPOSE: Defines the Flow structure for user journey sequences through a quest
 *
 * USAGE:
 * flowContract.parse({id: 'uuid', name: 'Login Flow', requirementIds: [], diagram: 'graph TD; A-->B', entryPoint: '/login', exitPoints: ['/dashboard']});
 * // Returns: Flow object
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { requirementIdContract } from '../requirement-id/requirement-id-contract';

export const flowContract = z.object({
  id: flowIdContract,
  name: z.string().min(1).brand<'FlowName'>(),
  requirementIds: z.array(requirementIdContract).default([]),
  diagram: z.string().min(1).brand<'MermaidDiagram'>(),
  entryPoint: z.string().min(1).brand<'FlowEntryPoint'>(),
  exitPoints: z.array(z.string().min(1).brand<'FlowExitPoint'>()),
});

export type Flow = z.infer<typeof flowContract>;
