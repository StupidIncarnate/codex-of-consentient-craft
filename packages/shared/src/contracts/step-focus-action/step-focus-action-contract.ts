/**
 * PURPOSE: Defines a non-file action that a step is responsible for — verification, command invocation, sweep check
 *
 * USAGE:
 * stepFocusActionContract.parse({kind: 'verification', description: 'Run ward and assert zero failures'});
 * // Returns: StepFocusAction object
 *
 * Used for operational flow steps that do not own a single file target. A step must have either
 * a focusFile OR a focusAction, not both. Verification steps (run ward, run grep predicate, check
 * deployment health), command steps (terraform apply, npm build), and sweep-check steps use this
 * shape instead of focusFile.
 */

import { z } from 'zod';

import { stepFocusActionKindContract } from '../step-focus-action-kind/step-focus-action-kind-contract';

export const stepFocusActionContract = z.object({
  kind: stepFocusActionKindContract,
  description: z.string().min(1).brand<'StepFocusActionDescription'>(),
});

export type StepFocusAction = z.infer<typeof stepFocusActionContract>;
