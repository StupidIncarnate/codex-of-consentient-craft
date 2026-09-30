/**
 * PURPOSE: Defines the validated shape for HTTP query string of GET /api/quests/:questId
 *
 * USAGE:
 * const { stage } = questGetQueryContract.parse(query);
 * // Returns { stage?: QuestStage }
 */

import { z } from '#gateway/npm/zod';
import { questStageContract } from '@dungeonmaster/shared/contracts';

export const questGetQueryContract = z.object({
  stage: questStageContract.optional(),
}).brand<'QuestGetQuery'>();

export type QuestGetQuery = z.infer<typeof questGetQueryContract>;
