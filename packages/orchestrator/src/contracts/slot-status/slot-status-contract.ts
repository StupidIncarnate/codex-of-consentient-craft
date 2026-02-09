/**
 * PURPOSE: Defines valid status values for orchestration slots
 *
 * USAGE:
 * slotStatusContract.parse('running');
 * // Returns: SlotStatus branded enum value
 */

import { z } from 'zod';

export const slotStatusContract = z.enum(['idle', 'running', 'completed', 'failed']);

export type SlotStatus = z.infer<typeof slotStatusContract>;
