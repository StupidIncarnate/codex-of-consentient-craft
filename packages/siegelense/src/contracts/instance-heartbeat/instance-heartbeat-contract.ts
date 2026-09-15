/**
 * PURPOSE: One instance's heartbeat file — pid, instance id, every child's process-group id, and a
 * beat timestamp updated every few seconds (spec line 1132). The pgids are the load-bearing field:
 * after a SIGKILL nothing in memory still holds them, so without this file the orphaned children can
 * only be guessed at, never found (spec line 1672). `registry.json` ALSO carries a `lastBeatMs`
 * column on each row — that is not redundant with this file, it answers a different question: the
 * row is what a fleet scan reads without opening N files, this file is what a post-mortem `Read`s
 * once the process that wrote it is gone. `heartbeatWriteBroker` writes both in one call.
 *
 * USAGE:
 * const heartbeat = instanceHeartbeatContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   pid: 'proc-12345',
 *   pgids: [4821],
 *   beatAtMs: 1700000000000,
 * });
 * // Returns a validated InstanceHeartbeat
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';

export const instanceHeartbeatContract = z.object({
  instanceId: instanceIdContract,
  pid: processIdContract,
  pgids: z.array(processGroupIdContract).readonly(),
  beatAtMs: epochMsContract,
});

export type InstanceHeartbeat = z.infer<typeof instanceHeartbeatContract>;
