/**
 * PURPOSE: The raw-file route into one instance's evidence directory (spec lines 1180, 1188:
 * "the raw-file route, and it survives the instance... a session that wants the whole server log
 * rather than a window has it without another call"): the directory itself, and EVERY file under it
 * — logs, heartbeat, run transcripts and stored returns, screenshots, video — each as an absolute
 * path. A walk of the directory rather than a list of known names, so a file kind nobody wrote a row
 * for (a recorded video) still shows up. `files` is in walk order: each directory's entries sorted by
 * name, a subdirectory's files listed where the subdirectory sorts. Reach for this over `results`
 * when the caller wants a file `Read` can open directly rather than a filtered, pre-parsed view of
 * the same evidence.
 *
 * USAGE:
 * instanceEvidenceListingContract.parse({
 *   dir: { path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c', linkPresent: true },
 *   files: [{ path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log', bytes: 2048 }],
 * });
 * // Returns a validated InstanceEvidenceListing
 */

import { z } from 'zod';

import { evidenceFileEntryContract } from '../evidence-file-entry/evidence-file-entry-contract';
import { repoLocalPathContract } from '../repo-local-path/repo-local-path-contract';

export const instanceEvidenceListingContract = z.object({
  dir: repoLocalPathContract,
  files: z.array(evidenceFileEntryContract).readonly(),
});

export type InstanceEvidenceListing = z.infer<typeof instanceEvidenceListingContract>;
