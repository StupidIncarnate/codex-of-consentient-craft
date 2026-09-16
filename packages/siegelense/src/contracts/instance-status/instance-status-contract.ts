/**
 * PURPOSE: One instance's row in a `status` answer — alive or dead, in both cases (spec lines
 * 1174-1183). `lastStep`, `evidence` and `likelyCause` stay `null` for every row in a `status {}`
 * fleet listing, even a dead one — `status {}` never lists runs or evidence (spec line 2380,
 * chunk-03 §3.D's no-browsing rule); they populate only in a `status { instance }` answer for that
 * one id. `rssMB` is null once an instance is dead and `rssAtLastBeat` is null while it is alive —
 * the two never both carry a value. Reach for this over `RegistryEntry` whenever the caller wants
 * the post-mortem shape a person reads, not the on-disk row a broker persists.
 *
 * USAGE:
 * instanceStatusContract.parse({
 *   id: 'inst_7f3a', state: 'alive', specName: 'dungeonmaster-web',
 *   uptime: '14m', lastBeat: '2s ago', runs: 3, rssMB: 1840, rssAtLastBeat: null,
 *   lastStep: null, orphans: [], evidence: null, likelyCause: null,
 * });
 * // Returns a validated InstanceStatus
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { elapsedTextContract } from '../elapsed-text/elapsed-text-contract';
import { instanceEvidenceListingContract } from '../instance-evidence-listing/instance-evidence-listing-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { instanceStateContract } from '../instance-state/instance-state-contract';
import { lastStepReadingContract } from '../last-step-reading/last-step-reading-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { orphanReadingContract } from '../orphan-reading/orphan-reading-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const instanceStatusContract = z.object({
  id: instanceIdContract,
  state: instanceStateContract,
  specName: specNameContract,
  uptime: elapsedTextContract.nullable(),
  lastBeat: elapsedTextContract.nullable(),
  runs: readingCountContract,
  rssMB: megabytesContract.nullable(),
  rssAtLastBeat: megabytesContract.nullable(),
  lastStep: lastStepReadingContract.nullable(),
  orphans: z.array(orphanReadingContract).readonly(),
  evidence: instanceEvidenceListingContract.nullable(),
  likelyCause: contentTextContract.nullable(),
});

export type InstanceStatus = z.infer<typeof instanceStatusContract>;
