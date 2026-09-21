/**
 * PURPOSE: Validates the ONE MCP write surface every LLM step calls — `quest-work` — across its six
 * payload kinds (`plan`, `observations`, `amendment`, `outcome`, `invalidation`, `request`). Lives
 * in the orchestrator rather than `shared` because the `plan` payload embeds `workPlanContract`
 * (story 07), and `shared` may not depend on the orchestrator.
 *
 * USAGE:
 * questWorkInputContract.parse({
 *   questId: 'add-auth',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   payload: { kind: 'outcome', word: 'done', reason: 'every assigned unit is met' },
 * });
 * // Returns: QuestWorkInput — the discriminator lives on `payload.kind`, never at the top level,
 * // because the envelope (questId, workItemId) is common to all six and the union is what varies
 *
 * `writtenBy` and `writtenAt` are `.omit()`ed from both plan-bearing payloads (`plan`, `amendment`)
 * and stamped server-side in the broker, exactly as `questInputServerTimestampsTransformer` already
 * replaces every timestamp a `modify-quest` payload carries — an LLM has no reliable clock, and an
 * omitted key is a REFUSED key under `.strict()`, never a silently-discarded one.
 *
 * RE-APPLYING `workPlanContract`'s AND `unitObservationContract`'s REFINEMENTS WITHOUT DUPLICATING
 * THEM: `.superRefine()` returns a `ZodEffects` in zod 3, which carries no `.shape`, so the callback
 * behind either refined contract cannot be pulled out and re-attached to an `.omit()`ed shape without
 * a second declaration of the same rule — and `@dungeonmaster/enforce-project-structure` refuses two
 * value exports from one contract file, so the callback cannot be exported separately either. The
 * envelope's own `.superRefine()` below instead ROUND-TRIPS each omitted shape through the REAL
 * refined contract, filling the omitted server-stamped field with a throwaway value first: the check
 * that runs is the literal same validator, not a copy of its rule.
 */

import { z } from 'zod';

import {
  flowIdContract,
  questIdContract,
  questNoteContract,
  questWorkItemIdContract,
  stepNameContract,
  unitObservationContract,
  unitObservationFieldsContract,
} from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';
import { stepOutcomeContract } from '../step-outcome/step-outcome-contract';
import { workPlanContract } from '../work-plan/work-plan-contract';
import { workPlanFieldsContract } from '../work-plan-fields/work-plan-fields-contract';

// Both plan-bearing payloads (`plan`, `amendment`) carry the identical omitted shape — the caller
// never sends the two server-stamped fields, and both are re-validated the same round-trip way.
// `.strict()` here is load-bearing: `workPlanFieldsContract` is a bare `z.object()`, and `.omit()`
// alone STRIPS an unrecognized key rather than refusing it — a caller-supplied `writtenAt` would
// otherwise vanish silently instead of being rejected.
const planEnvelopeFieldsContract = workPlanFieldsContract
  .omit({
    writtenBy: true,
    writtenAt: true,
  })
  .strict();

// Same reasoning as `planEnvelopeFieldsContract` above — `.strict()` is what turns a
// caller-supplied `at` into a refusal instead of a silent strip.
const observationFieldsContract = unitObservationFieldsContract.omit({ at: true }).strict();

const planPayloadContract = z
  .object({
    kind: z.literal('plan'),
    plan: planEnvelopeFieldsContract,
  })
  .strict();

const observationsPayloadContract = z
  .object({
    kind: z.literal('observations'),
    observations: z.array(observationFieldsContract).min(1),
  })
  .strict();

const amendmentPayloadContract = z
  .object({
    kind: z.literal('amendment'),
    reason: z.string().min(1).brand<'AmendmentReason'>(),
    plan: planEnvelopeFieldsContract,
  })
  .strict();

const outcomePayloadContract = z
  .object({
    kind: z.literal('outcome'),
    word: stepOutcomeContract,
    reason: z.string().min(1).brand<'OutcomeReason'>(),
  })
  .strict();

const invalidationPayloadContract = z
  .object({
    kind: z.literal('invalidation'),
    flowId: flowIdContract,
    reason: questNoteContract.shape.detail,
  })
  .strict();

const requestPayloadContract = z
  .object({
    kind: z.literal('request'),
    step: stepNameContract,
    reason: z.string().min(1).brand<'RequestReason'>(),
  })
  .strict();

export const questWorkInputContract = z
  .object({
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
    payload: z.discriminatedUnion('kind', [
      planPayloadContract,
      observationsPayloadContract,
      amendmentPayloadContract,
      outcomePayloadContract,
      invalidationPayloadContract,
      requestPayloadContract,
    ]),
  })
  .strict()
  .superRefine((value, ctx) => {
    // A throwaway, valid-shaped stamp — the round-trip below only exists to exercise the CROSS-FIELD
    // rules (plannerMarks legality, the units 1:1 check, cant-meet/toSettle pairing); the real
    // server-side timestamp is stamped again in the broker, after this parse has already accepted
    // the call.
    const placeholderAt = isoTimestampContract.parse(new Date().toISOString());

    if (value.payload.kind === 'plan' || value.payload.kind === 'amendment') {
      const rehydrated = workPlanContract.safeParse({
        ...value.payload.plan,
        writtenBy: value.workItemId,
        writtenAt: placeholderAt,
      });

      if (!rehydrated.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payload', 'plan'],
          message: rehydrated.error.issues.map((issue) => issue.message).join('; '),
        });
      }
    }

    if (value.payload.kind === 'observations') {
      value.payload.observations.forEach((observation, index) => {
        const rehydrated = unitObservationContract.safeParse({
          ...observation,
          at: placeholderAt,
        });

        if (!rehydrated.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['payload', 'observations', index],
            message: rehydrated.error.issues.map((issue) => issue.message).join('; '),
          });
        }
      });
    }
  });

export type QuestWorkInput = z.infer<typeof questWorkInputContract>;
