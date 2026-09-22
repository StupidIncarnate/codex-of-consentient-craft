/**
 * PURPOSE: The likely remainder of a quest's execution — each MINTED scope's real work items, in the
 * order they ran, continued forward through `agentFlowStatics`'s `routes.done` edge to the next family
 * boundary. Reach for this to answer "what happens next" without re-deriving the step graph in a
 * renderer; reach for `nextActionTransformer` when the question is what the router does RIGHT NOW.
 *
 * USAGE:
 * questProjectionContract.parse({
 *   questId: 'add-auth',
 *   scopes: [{
 *     operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
 *     role: 'codeweaver',
 *     text: 'core: config load+validate adapter',
 *     status: 'in_progress',
 *     steps: [
 *       { step: 'plan', kind: 'actual', workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'complete' },
 *       { step: 'work', kind: 'planned' },
 *     ],
 *   }],
 *   totalPlannedSteps: 2,
 *   completedSteps: 1,
 * });
 * // Returns: QuestProjection
 *
 * ONLY MINTED SCOPES APPEAR. A family the relay has not yet routed to has no operation item on
 * `quest.operations` and no fan-out count this contract can stand behind — `codeweaver` alone can mean
 * anywhere from one scope to one per (package, flow) cell, decided at mint time from the flows as they
 * stand then. A caller that wants "there is more after this" reads the next family straight off
 * `questFlowStatics`, which names it regardless of how many scopes it turns out to mint.
 *
 * `kind: 'planned'` NEVER CROSSES A `routes.unmet` EDGE. A back-edge is real only once a session
 * actually takes it, at which point it is a fresh `kind: 'actual'` work item — projecting one in
 * advance would show a repair loop that may never happen. The walk stops the moment a step's
 * `routes.done` is undefined, `@done`, or `@blocked`; an empty `steps` tail on a scope is not an
 * error, it means the scope's remainder is already fully described by its `actual` rows.
 *
 * `status` ON A STEP ROW IS THE PERSISTED `WorkItemStatus` (`pending` / `queued` / `in_progress` /
 * `complete` / `failed` / `skipped`) — the work item's OWN lifecycle, never the graph outcome word
 * (`done` / `unmet` / `empty` / `wall`) a session declares against its assigned units. Present only on
 * `kind: 'actual'` rows, because a `kind: 'planned'` row has no work item behind it to read one off.
 *
 * `role`, `text` AND `status` ON A SCOPE ROW REUSE `operationItemContract`'s OWN FIELDS — `text` and
 * `status` via `.shape`, so the literal status set (`pending` / `in_progress` / `complete`) has one
 * source rather than a second enum that can drift from it.
 *
 * `.strict()` AT EVERY LEVEL, FOR THE SAME REASON `questSummaryContract` IS. The one producer,
 * `questProjectionBuildTransformer`, builds this as an object literal handed to `.parse()`, which takes
 * `unknown` — so TypeScript grades nothing at that call site. Without `.strict()` a field renamed here
 * and missed there would be STRIPPED and its replacement would fall back to a `.default()`, rendering a
 * confidently wrong projection with no error anywhere.
 *
 * `questProjectionStepContract` AND `questProjectionScopeContract` ARE DELIBERATELY NOT EXPORTED. They
 * are private helper shapes used once each, on this one wire contract — nothing else on either side
 * (the orchestrator's builder or the web's renderer) needs to parse or stub a lone scope or a lone step
 * outside the whole projection, unlike `questSummaryFlowContract`'s reuse across the summary and its
 * own tests.
 */

import { z } from 'zod';

import { operationItemContract } from '../operation-item/operation-item-contract';
import { operationItemIdContract } from '../operation-item-id/operation-item-id-contract';
import { pieceIdContract } from '../piece-id/piece-id-contract';
import { questIdContract } from '../quest-id/quest-id-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { stepNameContract } from '../step-name/step-name-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';
import { workItemStatusContract } from '../work-item-status/work-item-status-contract';

const projectedStepCountContract = z.number().int().nonnegative().brand<'ProjectedStepCount'>();

const questProjectionStepContract = z
  .object({
    step: stepNameContract.describe(
      'A real key into `agentFlowStatics[family].steps` — never a display label.',
    ),
    kind: z
      .enum(['actual', 'planned'])
      .describe(
        "'actual' = a real work item exists at this step; 'planned' = projected forward along " +
          '`routes.done`, never yet dispatched.',
      ),
    workItemId: questWorkItemIdContract.optional().describe('Present iff kind === "actual".'),
    pieceId: pieceIdContract
      .optional()
      .describe('Present iff kind === "actual" and the work item ran a piece.'),
    status: workItemStatusContract.optional().describe('Present iff kind === "actual".'),
    mintedBy: questWorkItemIdContract
      .optional()
      .describe(
        'Copied straight off `WorkItem.mintedBy` — the back-edge badge reads this without re-deriving it.',
      ),
  })
  .strict();

const questProjectionScopeContract = z
  .object({
    operationId: operationItemIdContract,
    role: workItemRoleContract,
    text: operationItemContract.shape.text,
    status: operationItemContract.shape.status,
    steps: z
      .array(questProjectionStepContract)
      .default([])
      .describe(
        'Every `actual` row, in `quest.workItems` array order, followed by the `planned` tail.',
      ),
  })
  .strict();

export const questProjectionContract = z
  .object({
    questId: questIdContract,
    scopes: z
      .array(questProjectionScopeContract)
      .default([])
      .describe('One entry per MINTED operation item — a family not yet routed to has none here.'),
    totalPlannedSteps: projectedStepCountContract
      .default(0)
      .describe(
        'actual.length + planned.length, summed over every scope. Grows as an `unmet` mark routes new ' +
          'work; never shrinks.',
      ),
    completedSteps: projectedStepCountContract
      .default(0)
      .describe(
        '`kind: "actual"` rows whose `status` is `complete`, summed over every scope. Always ' +
          '<= totalPlannedSteps by construction, since a completed row is counted only among the ' +
          'actual rows that totalPlannedSteps already includes.',
      ),
  })
  .strict();

export type QuestProjection = z.infer<typeof questProjectionContract>;
