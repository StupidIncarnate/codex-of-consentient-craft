/**
 * PURPOSE: Validates the MCP-advertised shape of the `quest-work` tool call — the single write
 * surface every LLM step calls, across its six payload kinds. THIS copy exists only to be fed to
 * `zodToJsonSchema` for the advertised schema; the orchestrator's own `questWorkInputContract`
 * (`@dungeonmaster/orchestrator`, not importable from here — that package exports no `./contracts`
 * subpath) is the one that actually validates. `plan` and `amendment.plan` are deliberately
 * `z.record(z.unknown())`: the real per-family plan shape lives on `workPlanFieldsContract`
 * (orchestrator-only), and `signalBackInputContract` already carries this exact duplication, twice
 * — `packages/mcp/src/contracts/signal-back-input/` and `packages/server/src/contracts/signal-back-input/`.
 *
 * USAGE:
 * questWorkInputContract.parse({
 *   questId: 'add-auth',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   payload: { kind: 'outcome', word: 'done', reason: 'every assigned unit is met' },
 * });
 * // Returns: QuestWorkInput
 */

import { z } from 'zod';

const planPayloadContract = z
  .object({
    kind: z.literal('plan'),
    plan: z
      .record(z.unknown())
      .describe(
        "The pieces and their batches, plus plannerMarks — story 07's whole-plan envelope, minus writtenBy/writtenAt (stamped server-side).",
      ),
  })
  .strict();

const observationsPayloadContract = z
  .object({
    kind: z.literal('observations'),
    observations: z
      .array(
        z
          .object({
            unitId: z.string().min(1).brand<'UnitId'>(),
            mark: z.enum(['met', 'cant-meet', 'unmet']),
            evidence: z.string().min(1).brand<'MarkEvidence'>(),
            toSettle: z.string().min(1).brand<'ToSettleInstruction'>().optional(),
          })
          .strict(),
      )
      .min(1)
      .describe(
        'Per unit, one of met / cant-meet / unmet, with evidence. toSettle is required on cant-meet and refused elsewhere.',
      ),
  })
  .strict();

const amendmentPayloadContract = z
  .object({
    kind: z.literal('amendment'),
    reason: z
      .string()
      .min(1)
      .brand<'AmendmentReason'>()
      .describe('What the run revealed that makes the plan wrong.'),
    plan: z
      .record(z.unknown())
      .describe(
        'The WHOLE replacement plan, in the same shape as the plan payload — never a patch.',
      ),
  })
  .strict();

const outcomePayloadContract = z
  .object({
    kind: z.literal('outcome'),
    word: z.enum(['done', 'unmet', 'empty', 'wall']),
    reason: z.string().min(1).brand<'OutcomeReason'>().describe('Required on all four words.'),
  })
  .strict();

const invalidationPayloadContract = z
  .object({
    kind: z.literal('invalidation'),
    flowId: z.string().min(1).brand<'FlowId'>(),
    reason: z
      .string()
      .min(1)
      .brand<'ResetReason'>()
      .describe(
        "What changed underneath the flow's already-recorded marks. Recorded as the walk-reset note detail.",
      ),
  })
  .strict();

const requestPayloadContract = z
  .object({
    kind: z.literal('request'),
    step: z
      .string()
      .min(1)
      .brand<'StepName'>()
      .describe("Must be mintableOnRequest: true in the asking work item's own family graph."),
    reason: z
      .string()
      .min(1)
      .brand<'RequestReason'>()
      .describe('Why this step is blocked without it.'),
  })
  .strict();

export const questWorkInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .brand<'QuestId'>()
      .describe('The ID of the quest this call is against.'),
    workItemId: z
      .string()
      .min(1)
      .brand<'QuestWorkItemId'>()
      .describe(
        'The work item you were dispatched against. There is no ambient caller identity over MCP stdio.',
      ),
    payload: z.discriminatedUnion('kind', [
      planPayloadContract,
      observationsPayloadContract,
      amendmentPayloadContract,
      outcomePayloadContract,
      invalidationPayloadContract,
      requestPayloadContract,
    ]),
  })
  .strict();

export type QuestWorkInput = z.infer<typeof questWorkInputContract>;
