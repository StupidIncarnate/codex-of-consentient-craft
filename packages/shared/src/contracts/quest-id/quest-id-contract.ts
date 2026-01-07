/**
 * PURPOSE: Defines the branded string type for Quest identifiers
 *
 * USAGE:
 * questIdContract.parse('add-auth');
 * // Returns: QuestId branded string
 */

import { z } from 'zod';

export const questIdContract = z.string().min(1).brand<'QuestId'>();

export type QuestId = z.infer<typeof questIdContract>;
