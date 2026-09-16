/**
 * PURPOSE: One entry in callerCwdScanCursorState — how far (in bytes) a session or sub-agent
 * JSONL file has already been scanned for a caller's cwd. Caching this CURSOR, not a resolved
 * cwd, is what lets a warm lookup read only the bytes appended since the last call and still see
 * a cwd change the instant it is written, rather than serving a frozen answer from earlier in the
 * session (exactly what happened, and was caught by a test, in this very session — it began in
 * the main checkout and moved to a worktree mid-session).
 *
 * USAGE:
 * callerCwdScanCursorContract.parse({ filepath: '/home/u/.claude/projects/-x/s.jsonl', offsetBytes: 4096 });
 * // Returns branded CallerCwdScanCursor
 */

import { z } from 'zod';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

export const callerCwdScanCursorContract = z.object({
  filepath: absoluteFilePathContract,
  offsetBytes: z.number().int().nonnegative().brand<'ByteOffset'>(),
});

export type CallerCwdScanCursor = z.infer<typeof callerCwdScanCursorContract>;
