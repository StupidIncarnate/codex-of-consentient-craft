/**
 * PURPOSE: Defines the validated shape for HTTP query string of GET /api/quests/:questId
 *
 * USAGE:
 * const { stage } = questGetQueryContract.parse(query);
 * // Returns { stage?: QuestStage }
 */

import { z } from 'zod';
import { questStageContract } from '@dungeonmaster/shared/contracts';

export const questGetQueryContract = z.object({
  stage: questStageContract.optional(),
});

export type QuestGetQuery = z.infer<typeof questGetQueryContract>;
