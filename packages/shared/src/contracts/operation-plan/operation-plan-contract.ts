/**
 * PURPOSE: One planner sub-agent's output for a single operation-item round — the artifact a
 * planner writes onto the quest so the orchestrator session that dispatched it can read the plan
 * back without holding the spike in its own context
 *
 * USAGE:
 * operationPlanContract.parse({
 *   id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
 *   operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
 *   workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
 *   discipline: 'implementation',
 *   summary: 'The id contract mirrors operation-item-id; no blockers found.',
 *   at: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns: OperationPlan object
 */

import { z } from 'zod';

import { operationItemIdContract } from '../operation-item-id/operation-item-id-contract';
import { operationPlanIdContract } from '../operation-plan-id/operation-plan-id-contract';
import { operationPlanPieceContract } from '../operation-plan-piece/operation-plan-piece-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';

export const operationPlanContract = z.object({
  id: operationPlanIdContract.describe(
    'Identity for this plan. The orchestrator reads a plan back by this id after the planner ' +
      'sub-agent that wrote it has returned, without holding the plan body in its own context.',
  ),
  operationItemId: operationItemIdContract.describe(
    'The ledger item this plan was produced for — the operation-item whose dispatch prompted the ' +
      'planner sub-agent to spike this plan.',
  ),
  workItemId: questWorkItemIdContract.describe(
    'The work item that ran the planner sub-agent and produced this plan — the session whose ' +
      'output this is.',
  ),
  round: z
    .number()
    .int()
    .positive()
    .brand<'OperationPlanRound'>()
    .default(1)
    .describe(
      'Which plan/work/review round produced this plan. Starts at 1; a rejected round (see ' +
        'operationPlanPieceContract status) that gets re-planned bumps this, so two plans for the ' +
        'same operationItemId are distinguishable by round rather than overwriting each other.',
    ),
  discipline: z
    .string()
    .min(1)
    .brand<'OperationPlanDiscipline'>()
    .describe(
      'One of implementation | bug-repro | below-browser | browser-e2e | manual-qa. A plain ' +
        'branded string here because the enum itself is owned by the orchestrator package, which ' +
        'shared must not depend on — validate against the real enum at the orchestrator boundary, ' +
        'not here.',
    ),
  summary: z
    .string()
    .min(1)
    .brand<'OperationPlanSummary'>()
    .describe(
      "What the planner found — the spike's conclusion in prose, read by the orchestrator (or a " +
        'human) without opening any of the pieces. Should stand alone: a reader who never looks at ' +
        'pieces[] should still know what is about to happen and why.',
    ),
  pieces: z
    .array(operationPlanPieceContract)
    .default([])
    .describe(
      'The ordered units of work this plan breaks into. Empty is valid for a plan whose spike ' +
        'concluded no further work is needed — see summary for why.',
    ),
  at: z
    .string()
    .datetime()
    .brand<'IsoTimestamp'>()
    .describe(
      'STAMPED SERVER-SIDE — any client-supplied value is ignored and overwritten at write time. ' +
        'An LLM has no reliable clock: agents writing this field have been observed emitting ' +
        'identical fabricated timestamps across unrelated calls, and timestamps set in the future. ' +
        'Never trust or read this field as agent-authored; it exists only so a reader can order ' +
        'plans without asking the filesystem.',
    ),
});

export type OperationPlan = z.infer<typeof operationPlanContract>;
