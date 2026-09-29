/**
 * PURPOSE: Defines a branded enum type for session list filter modes
 *
 * USAGE:
 * sessionFilterContract.parse('all');
 * // Returns: SessionFilter branded string
 */

import { z } from '#gateway/npm/zod';

export const sessionFilterContract = z.enum(['all', 'quests-only']);

export type SessionFilter = z.infer<typeof sessionFilterContract>;
