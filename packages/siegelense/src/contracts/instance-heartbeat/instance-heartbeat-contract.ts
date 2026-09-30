/**
 * PURPOSE: One instance's heartbeat file — pid, instance id, every child's process-group id, a beat
 * timestamp updated every few seconds (spec line 1132), and the RSS measured across those pgids at
 * that same beat. `registry.json` ALSO carries a `lastBeatMs` column on each row — that is not
 * redundant with this file, it answers a different question: the row is what a fleet scan reads
 * without opening N files, this file is what a post-mortem `Read`s once the process that wrote it is
 * gone. `rssMB` is `.nullable()`, never `.optional()`, because it round-trips through
 * `JSON.stringify` the same way every other field here does, and because a dead instance's own pgids
 * are usually gone by the time anyone asks — this beat is the last chance to have measured them, so a
 * post-mortem's `memory` (`measured: 'at-last-beat'`) is a fact this file already recorded rather than a number `status`
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

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';

export const instanceHeartbeatContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    pid: z.string().min(1).brand<'InstanceHeartbeatPid'>(),
    pgids: z.array(z.number().int().positive().brand<'InstanceHeartbeatPgids'>()).readonly(),
    beatAtMs: z.number().int().nonnegative().brand<'InstanceHeartbeatBeatAtMs'>(),
    rssMB: z.number().int().nonnegative().brand<'InstanceHeartbeatRssMB'>().nullable(),
  })
  .brand<'InstanceHeartbeat'>();

export type InstanceHeartbeat = z.infer<typeof instanceHeartbeatContract>;
