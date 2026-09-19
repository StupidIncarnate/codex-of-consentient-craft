/**
 * PURPOSE: One Claude transcript now on disk — what the `write` route hands back once it has
 * written the JSONL file. Reach for this over its sibling, `sessionFieldsContract`, on a route's
 * OUTPUT side: `filePath` (the encoded `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl` path) and
 * `lineCount` are values the route computes, never something a caller supplies. There is no
 * whole-session contract anywhere else in this repo to derive `record` from — `questSessionContract`
 * is a per-quest row recording only a cwd, `sessionListItemContract` is a UI listing row, and the
 * `*-stream-line` contracts are per-LINE — so this file assembles the shape fresh out of the
 * per-field contracts that do exist.
 *
 * USAGE:
 * sessionRecordContract.parse({
 *   sessionId: 'seed-session-1',
 *   cwd: '/tmp/guilds-under-test/guild-1',
 *   filePath: '/tmp/guilds-under-test/guild-1/.claude/projects/-tmp-guilds-under-test-guild-1/seed-session-1.jsonl',
 *   lineCount: 1,
 * });
 * // Returns SessionRecord
 */
import { z } from 'zod';

import {
  absoluteFilePathContract,
  lineCountContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const sessionRecordContract = z.object({
  sessionId: sessionIdContract,
  cwd: absoluteFilePathContract,
  filePath: absoluteFilePathContract,
  lineCount: lineCountContract,
});

export type SessionRecord = z.infer<typeof sessionRecordContract>;
