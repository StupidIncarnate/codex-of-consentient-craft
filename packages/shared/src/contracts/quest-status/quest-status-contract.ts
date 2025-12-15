/**
 * PURPOSE: Defines valid quest status values
 *
 * USAGE:
 * questStatusContract.parse('in_progress');
 * // Returns: 'in_progress' as QuestStatus
 */

import { z } from 'zod';

export const questStatusContract = z.enum(['in_progress', 'blocked', 'complete', 'abandoned']);

export type QuestStatus = z.infer<typeof questStatusContract>;
