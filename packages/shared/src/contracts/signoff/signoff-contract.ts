/**
 * PURPOSE: Defines one track's verification sign-off on a unit — the verdict, the evidence behind
 * it, and the work item that produced it
 *
 * USAGE:
 * signoffContract.parse({
 *   verdict: 'confirmed',
 *   evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: Signoff — the value stored on `flowriderSignoff` or `siegemasterSignoff`
 *
 * `at` is REQUIRED here because this is the PERSISTED shape and a stored sign-off always carries
 * one. It is the write path — `questModifyBroker` — that puts it there, overwriting whatever the
 * caller sent; the modify-quest input shape therefore accepts the field missing.
 *
 * `evidence` is required on BOTH verdicts and is never an adjective. On `confirmed` it is the proof:
 * a test `file:line` plus what makes that test fail (Flowrider), the value measured off the running
 * system (Siegemaster), or the SOURCE `file:line` where the statement holds, for an observable
 * carrying `verifyByReading` — that third form exists because no test reaches such a unit, so a
 * describe() naming only the first two would tell the one track that CAN settle it that its evidence
 * does not count. On `unconfirmable` it is the specific reason confirmation was out of reach.
 *
 * `toSettle` is required only when the verdict is `unconfirmable`, and it is what turns "could not
 * confirm" from a shrug into a routable item: the ACTION that would settle the unit, stated as an
 * instruction someone else can carry out. It is never phrased as a question — a question hands the
 * next session something to answer, and what it needs is something to do.
 * The rule uses `superRefine` rather than `refine` so the issue lands on `path: ['toSettle']` — a
 * form-level error would tell a reader the whole sign-off is wrong instead of naming the one field
 * that is missing.
 */

import { z } from 'zod';

import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { signoffVerdictContract } from '../signoff-verdict/signoff-verdict-contract';

export const signoffContract = z
  .object({
    verdict: signoffVerdictContract,
    evidence: z
      .string()
      .min(1)
      .brand<'SignoffEvidence'>()
      .describe(
        'The proof behind the verdict — a test file:line plus what makes it fail, the value read off the running system, or, on an observable carrying verifyByReading, the SOURCE file:line where the statement holds plus what its absence would look like. Never an adjective: "held", "as expected", "verified" are the report grading itself.',
      ),
    toSettle: z
      .string()
      .min(1)
      .brand<'SignoffToSettle'>()
      .optional()
      .describe(
        'Required on `unconfirmable`: the action that would settle this unit, stated as an instruction someone else can carry out — "drive a real send through a live quest and read the session JSONL for a Read call on the written path". Never a question: the next session needs something to DO, not something to answer.',
      ),
    workItemId: questWorkItemIdContract,
    at: z
      .string()
      .datetime()
      .brand<'IsoTimestamp'>()
      .describe(
        'STAMPED SERVER-SIDE — any client-supplied value is ignored and overwritten at write time. ' +
          'An LLM has no reliable clock: agents writing this field have been observed emitting one ' +
          'identical fabricated timestamp across every sign-off on a quest, and timestamps set in a ' +
          'future that never happened. Required here because a persisted sign-off always carries ' +
          'one; the modify-quest input shape drops the requirement, since the write path supplies it.',
      ),
  })
  .superRefine((value, ctx) => {
    if (value.verdict === 'unconfirmable' && value.toSettle === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toSettle'],
        message:
          'toSettle is required when verdict is unconfirmable — state the action that would settle this unit, as an instruction rather than a question',
      });
    }
  });

export type Signoff = z.infer<typeof signoffContract>;
