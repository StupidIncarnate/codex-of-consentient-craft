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
 * `evidence` is required on BOTH verdicts and is never an adjective. On `confirmed` it is the proof:
 * a test `file:line` plus what makes that test fail (Flowrider), or the value measured off the
 * running system (Siegemaster). On `unconfirmable` it is the specific reason confirmation was out of
 * reach.
 *
 * `question` is required only when the verdict is `unconfirmable`, and it is what turns "could not
 * confirm" from a shrug into a routable item: what was tried, and why it could not be confirmed.
 * The rule uses `superRefine` rather than `refine` so the issue lands on `path: ['question']` — a
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
        'The proof behind the verdict — a test file:line plus what makes it fail, or the value read off the running system. Never an adjective: "held", "as expected", "verified" are the report grading itself.',
      ),
    question: z
      .string()
      .min(1)
      .brand<'SignoffQuestion'>()
      .optional()
      .describe(
        'Required on `unconfirmable`: what was tried and why it could not be confirmed, phrased so someone else can pick it up.',
      ),
    workItemId: questWorkItemIdContract,
    at: z.string().datetime().brand<'IsoTimestamp'>(),
  })
  .superRefine((value, ctx) => {
    if (value.verdict === 'unconfirmable' && value.question === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['question'],
        message:
          'question is required when verdict is unconfirmable — say what was tried and why it could not be confirmed',
      });
    }
  });

export type Signoff = z.infer<typeof signoffContract>;
