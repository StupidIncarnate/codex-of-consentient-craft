/**
 * PURPOSE: Defines the output structure for stream JSON line parsing with chat entries and optional session ID
 *
 * USAGE:
 * streamJsonResultContract.parse({entries: [], sessionId: null});
 * // Returns validated StreamJsonResult object
 */

import { z } from 'zod';

import { chatEntryContract } from '../chat-entry/chat-entry-contract';

export const streamJsonResultContract = z.object({
  entries: z.array(chatEntryContract),
  sessionId: z.string().min(1).brand<'SessionId'>().nullable(),
});

export type StreamJsonResult = z.infer<typeof streamJsonResultContract>;
