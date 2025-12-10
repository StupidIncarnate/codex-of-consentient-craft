/**
 * PURPOSE: Defines the quest phase types in order of execution
 *
 * USAGE:
 * phaseTypeContract.parse('discovery');
 * // Returns: 'discovery' as PhaseType
 */

import { z } from 'zod';

export const phaseTypeContract = z.enum(['discovery', 'implementation', 'testing', 'review']);

export type PhaseType = z.infer<typeof phaseTypeContract>;
