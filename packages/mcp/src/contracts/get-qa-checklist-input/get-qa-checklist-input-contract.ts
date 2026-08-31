/**
 * PURPOSE: Validates input for the get-qa-checklist MCP tool
 *
 * USAGE:
 * getQaChecklistInputContract.parse({questId: 'add-auth', operationItemId: '...'});
 * // Returns: GetQaChecklistInput scoped to exactly what that operation item is measured over
 *
 * getQaChecklistInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQaChecklistInput for every flow on the quest, with no track applied
 *
 * **`operationItemId` IS THE SCOPE.** The item carries the track (its `role`), its `flowIds` and its
 * `packageNames`, and the server derives all three through `operationSignoffScopeTransformer` — the
 * SAME transformer every other reader of this operation item's coverage uses, so the remainder a
 * session reads here is a work list, not a gate: nothing refuses a `done` over it.
 *
 * IT REPLACED `track`, `flowId` AND `packageNames` AS SEPARATE ARGUMENTS, and each of those was a
 * way to ask a different question from the one this scope answers:
 *
 * - `track` is the DENOMINATOR name, not the sign-off field. More than one role can write one field,
 *   so naming a sibling returned the exact complement of the caller's own work.
 * - `packageNames` was `.optional()`, so omitting it did not error — it silently WIDENED the
 *   measurement to the whole quest, and the session then read a remainder wider than its own.
 * - `flowId` did the same for every track: each one's scope is the item's own flow list.
 *
 * All three failed by OVER-reporting, which is the direction that never surfaces: the remainder
 * simply never reached empty, with nothing naming the cause.
 *
 * It is also what makes the tool reachable from a MINION, which is the session that actually needs
 * the body. A `get-agent-prompt` minion fetch carries the Quest ID and nothing else, so a scope
 * assembled from three values only the parent holds cannot be assembled at all; an id the parent
 * writes into the briefing can.
 *
 * `flowId` survives ONLY as the un-scoped browse form, for a caller that owns no operation item.
 * The schema is `.strict()`, so passing it alongside `operationItemId` is a hard rejection rather
 * than a silently ignored argument.
 */

import { z } from 'zod';

export const getQaChecklistInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to enumerate the QA surface for')
      .brand<'QuestId'>(),
    operationItemId: z
      .string()
      .min(1)
      .describe(
        "The operation item this work is for — the ONE argument that scopes this call. Everything the denominator depends on is already on that item (its role is the track, plus its flowIds and packageNames), and the server derives them with the same transformer every reader of this coverage uses, so what you read here is your track's work list. Pass it and REMAINING is your remainder. A role with no sign-off track (spiritmender, warpgate) is told so plainly: its denominator is the scope block in its Operation Context, not the flow graph.",
      )
      .brand<'OperationItemId'>()
      .optional(),
    flowId: z
      .string()
      .min(1)
      .describe(
        'Browse ONE flow with no track applied — for a caller that owns no operation item. Never pass it alongside operationItemId: the item already says which flows are in scope, and a hand-picked flow is how a session ends up measuring something other than what its coverage scope measures.',
      )
      .brand<'FlowId'>()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    // Hard rejection rather than a precedence rule. `operationItemId` already says which flows are
    // in scope, so a hand-picked `flowId` alongside it can only mean the caller believes it is
    // measuring something the item does not cover — and silently letting one win is how a session
    // ends up reading a different set from its own coverage scope.
    if (value.operationItemId !== undefined && value.flowId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['flowId'],
        message:
          'flowId cannot be combined with operationItemId — the operation item already declares which flows are in scope, and its own denominator is the ONE scope this call answers for. Pass operationItemId alone.',
      });
    }
  })
  .brand<'GetQaChecklistInput'>();

export type GetQaChecklistInput = z.infer<typeof getQaChecklistInputContract>;
