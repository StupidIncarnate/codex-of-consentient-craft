/**
 * PURPOSE: One compiled folder a lane serves that is behind the checkout — the folder, when it was
 * last written, the commit HEAD held then, and every file the working tree now differs from that
 * commit by and has touched since. `servedBuildStaleReadBroker` hands back one per such folder and
 * nothing for a folder that is current, so an empty list means "nothing stale was found", never
 * "the check did not run". `changedFiles` is repo-relative, as git names them, and may hold files
 * the served folder never compiled — siegelense knows no package layout, so it reports every
 * changed file and leaves the reading to the caller.
 *
 * USAGE:
 * servedBuildStaleContract.parse({
 *   outDir: 'packages/web/dist',
 *   builtAtMs: 1790717738233,
 *   baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
 *   changedFiles: ['packages/web/src/app.tsx'],
 * });
 * // Returns a validated ServedBuildStale
 */

import { z } from '#gateway/npm/zod';

export const servedBuildStaleContract = z
  .object({
    outDir: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return false;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return false;
          }
          return true;
        },
        { message: 'Path must be repo-relative (not absolute)' },
      )
      .brand<'ServedBuildStaleOutDir'>(),
    builtAtMs: z.number().int().nonnegative().brand<'ServedBuildStaleBuiltAtMs'>(),
    baseCommit: z.string().brand<'ServedBuildStaleBaseCommit'>(),
    changedFiles: z
      .array(
        z
          .string()
          .min(1)
          .refine(
            (path) => {
              if (path.startsWith('/')) {
                return false;
              }
              if (/^[A-Za-z]:\\/u.test(path)) {
                return false;
              }
              return true;
            },
            { message: 'Path must be repo-relative (not absolute)' },
          )
          .brand<'ServedBuildStaleChangedFiles'>(),
      )
      .readonly(),
  })
  .brand<'ServedBuildStale'>();

export type ServedBuildStale = z.infer<typeof servedBuildStaleContract>;
