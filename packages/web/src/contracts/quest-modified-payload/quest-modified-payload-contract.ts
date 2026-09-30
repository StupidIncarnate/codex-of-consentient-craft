/**
 * PURPOSE: Defines the payload shape carried by quest-modified WebSocket messages consumed by the web client
 *
 * USAGE:
 * questModifiedPayloadContract.parse({quest: {...}});
 * // Returns QuestModifiedPayload carrying the parsed quest; its id is quest.id
 */

import { z } from '#gateway/npm/zod';

import { questContract } from '@dungeonmaster/shared/contracts';

export const questModifiedPayloadContract = z
  .object({
    quest: questContract,
  })
  .brand<'QuestModifiedPayload'>();

export type QuestModifiedPayload = z.infer<typeof questModifiedPayloadContract>;
