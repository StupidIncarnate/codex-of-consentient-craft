/**
 * PURPOSE: Defines a branded enum type for session list filter modes
 *
 * USAGE:
 * sessionFilterContract.parse('all');
 * // Returns: SessionFilter branded string
 */

import { z } from 'zod';

export const sessionFilterContract = z.enum(['all', 'quests-only']).brand<'SessionFilter'>();

export type SessionFilter = z.infer<typeof sessionFilterContract>;
