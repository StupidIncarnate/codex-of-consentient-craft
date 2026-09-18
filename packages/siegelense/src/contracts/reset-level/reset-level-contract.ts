/**
 * PURPOSE: Defines the three named reset levels ('page', 'state', 'instance') for the reset step verb,
 * each declaring what it clears and what it keeps.
 *
 * USAGE:
 * resetLevelContract.parse('state');
 * // Returns 'state' as branded ResetLevel
 */

import { z } from 'zod';

export const resetLevelContract = z.enum(['page', 'state', 'instance']).brand<'ResetLevel'>();

export type ResetLevel = z.infer<typeof resetLevelContract>;
