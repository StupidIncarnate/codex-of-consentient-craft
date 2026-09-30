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
import { z } from '#gateway/npm/zod';

export const writeFailureContract = z
  .object({
    path: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'WriteFailurePath'>()
      .nullable(),
  })
  .brand<'WriteFailure'>();

export type WriteFailure = z.infer<typeof writeFailureContract>;
