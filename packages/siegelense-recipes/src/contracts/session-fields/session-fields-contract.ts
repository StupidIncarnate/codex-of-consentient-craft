/**
 * PURPOSE: What a caller may supply to make a session — the transcript's own id, the directory it
 * runs under, and the JSONL lines to write. Reach for this over its sibling, `sessionRecordContract`,
 * on a route's INPUT side: unlike a guild or a quest, nothing in this repo mints a session id — the
 * caller invents `sessionId` up front, exactly as a real Claude session's caller does — so `fields`
 * and `record` differ only in what the `write` route derives afterward (the encoded on-disk
 * `filePath` and the `lineCount` it just appended), never in who assigns the identity.
 *
 * USAGE:
 * sessionFieldsContract.parse({
 *   sessionId: 'seed-session-1',
 *   cwd: '/tmp/guilds-under-test/guild-1',
 *   lines: ['{"type":"user","message":{"role":"user","content":"hello"}}'],
 * });
 * // Returns SessionFields
 */
import { z } from 'zod';

import {
  absoluteFilePathContract,
  sessionIdContract,
  streamJsonLineContract,
} from '@dungeonmaster/shared/contracts';

export const sessionFieldsContract = z.object({
  sessionId: sessionIdContract,
  cwd: absoluteFilePathContract,
  lines: z.array(streamJsonLineContract),
});

export type SessionFields = z.infer<typeof sessionFieldsContract>;
