/**
 * PURPOSE: Defines the payload shape carried by quest-load-failed WebSocket messages consumed by the web client
 *
 * USAGE:
 * questLoadFailedPayloadContract.parse({questId: 'q-1' as QuestId, error: 'Failed to parse quest file at ...'});
 * // Returns QuestLoadFailedPayload — the questId whose read failed and the reason verbatim
 *
 * `error` is the server's message unchanged, because it is the only thing that names WHICH field of
 * quest.json rejected. A generic substitution here would strand the reader with no repair path.
 */

import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

import { errorBodyContract } from '../error-body/error-body-contract';

export const questLoadFailedPayloadContract = z.object({
  questId: questIdContract,
  error: errorBodyContract.shape.error,
});

export type QuestLoadFailedPayload = z.infer<typeof questLoadFailedPayloadContract>;
