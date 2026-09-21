/**
 * PURPOSE: Which STEP of its family's graph a work item's session is running — a key into
 * `agentFlowStatics[family].steps`, e.g. `'plan'`, `'work'`, `'review'`, `'commit'`,
 * `'happyWalk'`. Free-form rather than an enum: steps get added, removed and renamed as
 * families evolve, and a `quest.json` holding a work item whose step no longer exists must
 * still LOAD — dispatch is where an unknown step fails, loudly, naming the step and the
 * family. NOT the same vocabulary as `agentPromptNameContract` — a step key like `'work'`
 * and the prompt it dispatches, `'codeweaver-worker'`, are two different strings, and easy
 * to confuse because both contracts open the same way for the same reason.
 *
 * USAGE:
 * stepNameContract.parse('work');
 * // Returns a branded StepName
 */

import { z } from 'zod';

export const stepNameContract = z.string().min(1).brand<'StepName'>();

export type StepName = z.infer<typeof stepNameContract>;
