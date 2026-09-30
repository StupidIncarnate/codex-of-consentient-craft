/**
 * PURPOSE: Defines the output structure for stream JSON line parsing with chat entries and optional session ID
 *
 * USAGE:
 * streamJsonResultContract.parse({entries: [], sessionId: null});
 * // Returns validated StreamJsonResult object
 */

import { z } from '#gateway/npm/zod';

import { chatEntryContract, sessionContract } from '@dungeonmaster/shared/contracts';

export const streamJsonResultContract = z
  .object({
    entries: z.array(chatEntryContract),
    sessionId: sessionContract.shape.id.nullable(),
  })
  .brand<'StreamJsonResult'>();

export type StreamJsonResult = z.infer<typeof streamJsonResultContract>;
