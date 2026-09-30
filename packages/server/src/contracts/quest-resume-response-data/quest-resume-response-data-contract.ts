/**
 * PURPOSE: Defines the `data` QuestResumeResponder returns on success
 *
 * USAGE:
 * const data = questResumeResponseDataContract.parse(value);
 * // Returns validated QuestResumeResponseData
 */

import { z } from '#gateway/npm/zod';

export const questResumeResponseDataContract = z.strictObject({ dispatch: z.strictObject({ started: z.boolean() }), resumed: z.boolean(), restoredStatus: z.enum(["created", "pending", "explore_flows", "review_flows", "flows_approved", "explore_observables", "review_observables", "approved", "in_progress", "paused", "blocked", "complete", "merging", "merged", "abandoned"]) }).brand<'QuestResumeResponseData'>();

export type QuestResumeResponseData = z.infer<typeof questResumeResponseDataContract>;
