/**
 * PURPOSE: Defines the structure of data stored in an agent slot
 *
 * USAGE:
 * slotDataContract.parse({stepId: 'uuid', sessionId: 'session-1', startedAt: '2024-01-01T00:00:00Z'});
 * // Returns: SlotData object
 */

import { sessionIdContract, stepIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const slotDataContract = z.object({
  stepId: stepIdContract,
  sessionId: sessionIdContract,
  startedAt: isoTimestampContract,
});

export type SlotData = z.infer<typeof slotDataContract>;
