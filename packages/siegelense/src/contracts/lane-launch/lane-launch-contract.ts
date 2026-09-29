/**
 * PURPOSE: One lane process already resolved down to exactly what a spawn needs — the command, the
 * substituted args and fully merged env, the log file its stdout/stderr append to and the open fd for
 * it, and the URL its readiness probe hits (null for a process with no `readyPath` or no port). Reach
 * for this over `laneProcessContract` once the placeholders are gone: `laneProcessContract` is the
 * spec's TEMPLATE, this is one boot's resolved launch. `lane-boot-broker` builds the list once and
 * spawns from it at boot and again on every `reset level: 'instance'` restart, which is what keeps a
 * restarted process on the SAME ports, home, env, args and log file as the one it replaces.
 *
 * USAGE:
 * laneLaunchContract.parse({
 *   name: 'api', command: 'npm', args: ['run', 'dev:no-watch'], env: { HOME: '/tmp/dm-siege-inst_1' },
 *   logPath: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/api-server.log',
 *   fd: 10, readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
 * });
 * // Returns a LaneLaunch
 */

import { z } from 'zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { fileDescriptorContract } from '../file-descriptor/file-descriptor-contract';
import { laneProcessNameContract } from '../lane-process-name/lane-process-name-contract';

export const laneLaunchContract = z.object({
  name: laneProcessNameContract,
  command: contentTextContract,
  args: z.array(contentTextContract).readonly(),
  // Keys stay plain strings: this is the finished environment handed straight to `spawn`.
  env: z.record(contentTextContract),
  logPath: absoluteFilePathContract,
  fd: fileDescriptorContract,
  readyUrl: contentTextContract.nullable(),
});

export type LaneLaunch = z.infer<typeof laneLaunchContract>;
