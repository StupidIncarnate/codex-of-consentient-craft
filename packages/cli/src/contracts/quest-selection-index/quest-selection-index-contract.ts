/**
 * PURPOSE: Defines a branded non-negative integer type for quest selection indices
 *
 * USAGE:
 * const index: QuestSelectionIndex = questSelectionIndexContract.parse(0);
 * // Returns a branded QuestSelectionIndex integer (0 or positive)
 */
import { z } from 'zod';

export const questSelectionIndexContract = z.number().int().min(0).brand<'QuestSelectionIndex'>();

export type QuestSelectionIndex = z.infer<typeof questSelectionIndexContract>;
