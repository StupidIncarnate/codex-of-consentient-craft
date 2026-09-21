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

import { z } from 'zod';

export const getQuestWorkInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest this call is against.')
      .brand<'QuestId'>(),
    workItemId: z
      .string()
      .min(1)
      .describe(
        'The work item you were dispatched against. Pass it and you get EVERYTHING this session needs to start: your family, your step and its role, your scope, the units you were assigned and the ones your step is answerable for, your piece, what the sessions before you left, your flow rendered, your uncommitted and committed paths, the failing ward result and its check types, the carve log, and your lane if your step declares one. There is no ambient caller identity over MCP stdio, so this id is how the server knows who is asking.',
      )
      .brand<'QuestWorkItemId'>()
      .optional(),
    operationItemId: z
      .string()
      .min(1)
      .describe(
        'The operation item whose PLAN you want to read, as markdown: the batches in the order they will execute, each piece with the units it claims, and the coverage table naming every in-scope unit no piece claims. That last row is the defect a planner most needs to see and the one a JSON plan cannot show. Never pass it alongside workItemId — a work item asks what THIS session runs, and the two are different questions.',
      )
      .brand<'OperationItemId'>()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.workItemId !== undefined && value.operationItemId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operationItemId'],
        message:
          'operationItemId cannot be combined with workItemId — a work item asks what THIS session runs and an operation item asks whether the plan for the whole scope is sound. Pass exactly one.',
      });
    }

    if (value.workItemId === undefined && value.operationItemId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workItemId'],
        message:
          'pass either workItemId (everything this session needs to start) or operationItemId (the whole plan as markdown). There is no whole-quest browse form.',
      });
    }
  })
  .brand<'GetQuestWorkInput'>();

export type GetQuestWorkInput = z.infer<typeof getQuestWorkInputContract>;
