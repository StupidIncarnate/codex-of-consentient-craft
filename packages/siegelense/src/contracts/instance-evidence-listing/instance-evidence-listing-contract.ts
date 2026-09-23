/**
 * PURPOSE: The raw-file route into one instance's evidence directory (spec lines 1180, 1188:
 * "the raw-file route, and it survives the instance... a session that wants the whole server log
 * rather than a window has it without another call"). `transcript` and `lastShot` are `.nullable()`
 * because an instance that never ran a step, or never took a shot, has none. Reach for this over
 * `results` when the caller wants a file `Read` can open directly rather than a filtered,
 * pre-parsed view of the same evidence.
 *
 * USAGE:
 * instanceEvidenceListingContract.parse({
 *   dir: { path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c', linkPresent: true },
 *   transcript: 'run_2.jsonl',
 *   logs: ['api-server.log', 'web-server.log'],
 *   lastShot: 'run_2/step7.png',
 * });
 * // Returns a validated InstanceEvidenceListing
 */

import { z } from 'zod';

import { fileNameContract } from '@dungeonmaster/shared/contracts';

import { repoLocalPathContract } from '../repo-local-path/repo-local-path-contract';

export const instanceEvidenceListingContract = z.object({
  dir: repoLocalPathContract,
  transcript: fileNameContract.nullable(),
  logs: z.array(fileNameContract).readonly(),
  lastShot: fileNameContract.nullable(),
});

export type InstanceEvidenceListing = z.infer<typeof instanceEvidenceListingContract>;
