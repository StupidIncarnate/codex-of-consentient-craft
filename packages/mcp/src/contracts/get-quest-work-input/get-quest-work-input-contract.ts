/**
 * PURPOSE: Validates the MCP-advertised shape of the `get-quest-work` tool call — the ONE startup
 * call every LLM step makes. Its `workItemId` form asks "what does THIS session run", and its
 * `operationItemId` form answers a different question — whether the plan for the whole scope is
 * sound.
 *
 * USAGE:
 * getQuestWorkInputContract.parse({
 *   questId: 'add-auth',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns: GetQuestWorkInput
 *
 * `.strict()` PLUS A REFINEMENT REFUSING BOTH IDS AND NEITHER. Both is a hard rejection rather than
 * a precedence rule: letting one win silently answers a question the caller did not ask. Neither is
 * refused too — there is no whole-quest browse form here, and a call that named no scope would have
 * to guess one.
 */

import { z } from '#gateway/npm/zod';
import {
  questContract,
  workItemContract,
  operationItemContract,
} from '@dungeonmaster/shared/contracts';

export const getQuestWorkInputContract = z
  .object({
    questId: questContract.shape.id,
    workItemId: workItemContract.shape.id.optional(),
    operationItemId: operationItemContract.shape.id.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.workItemId !== undefined && value.operationItemId !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['operationItemId'],
        message:
          'operationItemId cannot be combined with workItemId — a work item asks what THIS session runs and an operation item asks whether the plan for the whole scope is sound. Pass exactly one.',
      });
    }

    if (value.workItemId === undefined && value.operationItemId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['workItemId'],
        message:
          'pass either workItemId (everything this session needs to start) or operationItemId (the whole plan as markdown). There is no whole-quest browse form.',
      });
    }
  })
  .brand<'GetQuestWorkInput'>();

export type GetQuestWorkInput = z.infer<typeof getQuestWorkInputContract>;
