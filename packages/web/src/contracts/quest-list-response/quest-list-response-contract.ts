/**
 * PURPOSE: Defines the response contract for the quest list API endpoint as an array of quest list items
 *
 * USAGE:
 * questListResponseContract.parse(apiResponse);
 * // Returns validated QuestListItem[] array
 */

import { z } from 'zod';

import { questListItemContract } from '@dungeonmaster/shared/contracts';

export const questListResponseContract = z.array(questListItemContract);

export type QuestListResponse = z.infer<typeof questListResponseContract>;
