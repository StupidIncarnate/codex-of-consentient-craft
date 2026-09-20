/**
 * PURPOSE: What `HydrationWriteFailedError` needs off whatever a `write` route's underlying file
 * operation actually threw — the path node's own `SystemError.path` carries, nullable because a
 * plain Error (or nothing at all) names no path. Reach for this over `routeFailureContract`: a
 * write route has no URL, no status and no response body, only a path and an OS-level cause.
 *
 * USAGE:
 * writeFailureContract.parse({ path: '/home/user/.dungeonmaster/guilds/foo/guild.json' });
 * writeFailureContract.parse({ path: null });
 * // Returns a WriteFailure
 */
import { z } from 'zod';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

export const writeFailureContract = z.object({
  path: absoluteFilePathContract.nullable(),
});

export type WriteFailure = z.infer<typeof writeFailureContract>;
