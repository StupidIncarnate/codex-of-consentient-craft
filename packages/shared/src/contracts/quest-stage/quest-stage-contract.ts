/**
 * PURPOSE: Defines the valid stage names for pipeline-oriented quest data filtering
 *
 * USAGE:
 * questStageContract.parse('spec');
 * // Returns branded 'spec' as QuestStage
 */
import { z } from '#gateway/npm/zod';

export const questStageContract = z.enum(['spec', 'planning', 'implementation']);

export type QuestStage = z.infer<typeof questStageContract>;
