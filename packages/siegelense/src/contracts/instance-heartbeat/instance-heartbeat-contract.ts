/**
 * PURPOSE: One instance's heartbeat file — pid, instance id, every child's process-group id, a beat
 * timestamp updated every few seconds (spec line 1132), and the RSS measured across those pgids at
 * that same beat. `registry.json` ALSO carries a `lastBeatMs` column on each row — that is not
 * redundant with this file, it answers a different question: the row is what a fleet scan reads
 * without opening N files, this file is what a post-mortem `Read`s once the process that wrote it is
 * gone. `rssMB` is `.nullable()`, never `.optional()`, because it round-trips through
 * `JSON.stringify` the same way every other field here does, and because a dead instance's own pgids
 * are usually gone by the time anyone asks — this beat is the last chance to have measured them, so a
 * post-mortem's `rssAtLastBeat` is a fact this file already recorded rather than a number `status`
 * would otherwise have to invent. `heartbeatWriteBroker` writes both in one call.
 *
 * USAGE:
 * const heartbeat = instanceHeartbeatContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   pid: 'proc-12345',
 *   pgids: [4821],
 *   beatAtMs: 1700000000000,
 *   rssMB: 1840,
 * });
 * // Returns a validated InstanceHeartbeat
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';

export const instanceHeartbeatContract = z.object({
  instanceId: instanceIdContract,
  pid: processIdContract,
  pgids: z.array(processGroupIdContract).readonly(),
  beatAtMs: epochMsContract,
  rssMB: megabytesContract.nullable(),
});

export type InstanceHeartbeat = z.infer<typeof instanceHeartbeatContract>;
