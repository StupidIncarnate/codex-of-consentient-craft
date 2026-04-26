/**
 * PURPOSE: Defines the payload shape carried by quest-modified WebSocket messages consumed by the web client
 *
 * USAGE:
 * questModifiedPayloadContract.parse({questId: 'q-1' as QuestId, quest: {...}});
 * // Returns QuestModifiedPayload with raw quest blob (validated separately by questContract)
 */

import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

export const questModifiedPayloadContract = z.object({
  questId: questIdContract,
  quest: z.unknown(),
});

export type QuestModifiedPayload = z.infer<typeof questModifiedPayloadContract>;
