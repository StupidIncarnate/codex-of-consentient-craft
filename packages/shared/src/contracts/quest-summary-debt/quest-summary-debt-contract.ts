/**
 * PURPOSE: One entry in a quest summary's DEBT list — a unit that is not proven, carried with the
 * mark that says why, the evidence behind it, and the work item and moment that recorded it. Reach
 * for this over `unitObservationContract` when the reader is a quest summary rather than a session:
 * an observation says what ONE session saw about one unit, while this entry adds the flow, the unit
 * kind, the denominator track and the `workItemId` a reader needs to route the debt to somebody.
 *
 * USAGE:
 * questSummaryDebtContract.parse({
 *   id: 'login-flow:observable:rejects-bleh-payload:flowrider',
 *   unitId: 'login-flow:observable:rejects-bleh-payload',
 *   flowId: 'login-flow',
 *   kind: 'observable',
 *   track: 'flowrider',
 *   mark: 'cant-meet',
 *   evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
 *   toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: QuestSummaryDebt — one element of the quest summary's debt list
 *
 * THE LIST CARRIES TWO MARKS, NOT ONE. `cant-meet` settles a unit without proving it; `unmet` means
 * work is outstanding right now. Both are debt and both need somewhere to appear. `met` is refused:
 * a proven unit is not debt, and admitting one would make the list's own length meaningless.
 *
 * `workItemId` AND `at` ARE WHAT MAKE AN ENTRY ROUTABLE — who recorded it and when they hit the
 * wall. They are the only route from a debt entry back to the session behind it, which is why they
 * are copied onto the entry rather than left on the work item the observation lives under.
 *
 * `id` IS THE UNIT CROSSED WITH THE TRACK because the tracks measure independently: one unit can
 * carry debt on more than one of them, for different reasons, and a unit-only id would collide.
 *
 * `track` IS THE DENOMINATOR TRACK, NOT A FIELD NAME. Which role is short is what a reader needs in
 * order to route the work, and more than one role can measure one unit — so naming a field would
 * leave "who is short here" ambiguous between roles whose remedies have nothing in common.
 * Denominators narrow by disjoint `packageTypes`, so no single unit is ever attributed to two.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';
import { qaChecklistKindContract } from '../qa-checklist-kind/qa-checklist-kind-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { unitMarkContract } from '../unit-mark/unit-mark-contract';
import { verificationTrackContract } from '../verification-track/verification-track-contract';

export const questSummaryDebtContract = z
  .object({
    id: z
      .string()
      .min(1)
      .brand<'QuestSummaryDebtId'>()
      .describe('`<unitId>:<track>` — the unit crossed with the track that has not proven it.'),
    unitId: qaChecklistItemIdContract,
    flowId: flowIdContract,
    kind: qaChecklistKindContract,
    track: verificationTrackContract,
    // Narrowed off `unitMarkContract` rather than re-typed, so a mark added there arrives here as a
    // compile error at the `.exclude()` call instead of silently staying out of the debt list.
    mark: unitMarkContract
      .exclude(['met'])
      .describe(
        'Why this unit is debt. `cant-meet`: this layer genuinely cannot confirm it, and `toSettle` names what would. `unmet`: work is outstanding right now and a successor is owed it.',
      ),
    // `MarkEvidence` and `ToSettleInstruction` are re-declared under the literals
    // `unitObservationFieldsContract` already uses rather than imported. A zod brand is structural
    // on the literal, so a re-declaration under the same literal is assignable both ways, and a typo
    // in one is a nominal type nothing satisfies — it fails at the first assignment.
    evidence: z
      .string()
      .min(1)
      .brand<'MarkEvidence'>()
      .describe(
        'What the recording session had. On `cant-meet`, why confirmation was out of reach for this layer. On `unmet`, what is left and what that session already learned.',
      ),
    toSettle: z
      .string()
      .min(1)
      .brand<'ToSettleInstruction'>()
      .optional()
      .describe(
        'The action that WOULD settle this unit — an instruction, never a question. Required on `cant-meet`; refused on `unmet`, which has a successor rather than a handover.',
      ),
    workItemId: questWorkItemIdContract,
    at: z
      .string()
      .datetime()
      .brand<'IsoTimestamp'>()
      .describe('The moment the mark was recorded, taken verbatim off the observation.'),
  })
  .superRefine((value, ctx) => {
    if (value.mark === 'cant-meet' && value.toSettle === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toSettle'],
        message:
          "toSettle is required when mark is 'cant-meet' — it names the action that WOULD settle " +
          'this unit. Without one, cant-meet is a dead end with no owner.',
      });
    }
    if (value.mark === 'unmet' && value.toSettle !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toSettle'],
        message:
          "toSettle is only valid when mark is 'cant-meet'. 'unmet' means work remains, not that " +
          'this layer gave up on it — a toSettle here reads as a handover nobody made.',
      });
    }
  });

export type QuestSummaryDebt = z.infer<typeof questSummaryDebtContract>;
