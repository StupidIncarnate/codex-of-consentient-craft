/**
 * PURPOSE: The answer to "where do I `Read` this" for every path siegelense hands back — reached
 * through the `<repoRoot>/.siegelense` symlink `dungeonmaster init` creates onto
 * `<home>/.dungeonmaster/siegelense/`, because a shot is a PNG and the only way a model sees one is a
 * `Read` of its path, so a path the reader's `Read` cannot reach hands back nothing. `linkPresent:
 * false` is the whole reason this contract exists rather than a bare `AbsoluteFilePath`: where a repo
 * has never run `init`, the symlink is absent and the tool still has to answer with the real path
 * under the home while saying plainly that the link is missing — a path that silently stops
 * resolving is the one failure worse than an inconvenient one.
 *
 * USAGE:
 * const location = repoLocalPathContract.parse({
 *   path: '/repo/.siegelense/guilds/g1/instances/inst_1',
 *   linkPresent: true,
 * });
 * // Returns a validated RepoLocalPath
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

export const repoLocalPathContract = z.object({
  path: absoluteFilePathContract,
  linkPresent: z.boolean(),
});

export type RepoLocalPath = z.infer<typeof repoLocalPathContract>;
