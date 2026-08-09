/**
 * PURPOSE: Names which of the three ways a halted quest gets picked back up is currently running,
 * so the one shared worktree-restore step can say who invoked it without each caller re-deriving a
 * log prefix. The set is closed on purpose: a fourth pickup surface that forgets to restore the
 * quest branch is exactly the defect this enumeration makes visible, since adding a call site means
 * adding a member to `questResumeTriggerStatics`. Reach for `processIdPrefixContract` instead when
 * the value is labelling a spawned process rather than the pickup that led to it.
 *
 * USAGE:
 * questResumeTriggerContract.parse('dispatch-scan');
 * // Returns the validated trigger; reject anything outside the union
 */

import { z } from 'zod';

import { questResumeTriggerStatics } from '../../statics/quest-resume-trigger/quest-resume-trigger-statics';

export const questResumeTriggerContract = z.enum(questResumeTriggerStatics.triggers);

export type QuestResumeTrigger = z.infer<typeof questResumeTriggerContract>;
