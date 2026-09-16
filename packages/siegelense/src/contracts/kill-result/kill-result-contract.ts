/**
 * PURPOSE: What `kill` hands back. `stopped` and `portsReleased` cover the ordinary path, where a
 * live driver answered the socket; `homeRemoved` and `evidenceKept` carry the state-versus-evidence
 * split this package holds everywhere else — `kill` removes the throwaway home and never the evidence
 * directory. `reapedPgids` covers the OTHER path: a driver that was SIGKILLed leaves a registry row
 * nobody signals, and `kill` accepts that dead instance's id anyway, reads its heartbeat file's
 * recorded pgids, and signals each process group directly (siegelense-tooling.md line 1172).
 * `reapedPgids` is empty on the ordinary path and carries the groups it found on the orphan path — the
 * one field a caller reads to tell which of the two actually happened.
 *
 * USAGE:
 * killResultContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   stopped: true,
 *   portsReleased: [34172, 34173],
 *   homeRemoved: true,
 *   evidenceKept: { path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21', linkPresent: true },
 *   reapedPgids: [],
 * });
 * // Returns a validated KillResult
 */

import { z } from 'zod';

import { networkPortContract } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';
import { repoLocalPathContract } from '../repo-local-path/repo-local-path-contract';

export const killResultContract = z.object({
  instanceId: instanceIdContract,
  stopped: z.boolean(),
  portsReleased: z.array(networkPortContract).readonly(),
  homeRemoved: z.boolean(),
  evidenceKept: repoLocalPathContract,
  reapedPgids: z.array(processGroupIdContract).readonly(),
});

export type KillResult = z.infer<typeof killResultContract>;
