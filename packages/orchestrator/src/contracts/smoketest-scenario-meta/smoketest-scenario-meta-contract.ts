/**
 * PURPOSE: Minimal scenario meta captured at enqueue time and passed to the post-terminal listener — case id + display name + startedAt epoch timestamp used to compute durationMs
 *
 * USAGE:
 * smoketestScenarioMetaContract.parse({ caseId: 'orch-happy-path', name: 'Orchestration: happy path', startedAt: Date.now() });
 * // Returns: SmoketestScenarioMeta
 */

import { z } from 'zod';

export const smoketestScenarioMetaContract = z.object({
  caseId: z.string().min(1).brand<'SmoketestCaseId'>(),
  name: z.string().min(1).brand<'SmoketestScenarioName'>(),
  startedAt: z.number().int().nonnegative().brand<'EpochMs'>(),
});

export type SmoketestScenarioMeta = z.infer<typeof smoketestScenarioMetaContract>;
