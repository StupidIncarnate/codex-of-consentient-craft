/**
 * PURPOSE: The whole lane a siegelense instance boots — N processes plus whether a browser rides
 * along — as DATA rather than the hardcoded shape `packages/web/test/siege-driver/siege-lane.ts`
 * carries today. Content, not name, is what a profile keys on (siegelense-tooling.md line 1703):
 * add a process here and the content hash changes, so a stale profile is caught by construction
 * rather than by someone remembering to invalidate it. `browser: false` is not a degraded spec — an
 * operational flow has no screen, so its instance wants the servers and no Chromium, and because the
 * profile is keyed by content it prices that cheaper spec on its own (line 2145). `env` here is
 * merged into every process's own env at boot; a process's own `env` is that process's override.
 *
 * USAGE:
 * const spec = laneSpecContract.parse({
 *   name: 'dungeonmaster-headless',
 *   processes: [{ name: 'api', command: 'npm', args: [], portRole: 'api', readyPath: '/api/guilds',
 *     logFileName: 'api-server.log', env: {} }],
 *   browser: false,
 *   bootTimeoutMs: 180000,
 *   env: { DUNGEONMASTER_PORT: '{apiPort}' },
 * });
 * // Returns a validated LaneSpec
 */

import { z } from 'zod';

import { contentTextContract, timeoutMsContract } from '@dungeonmaster/shared/contracts';

import { laneProcessContract } from '../lane-process/lane-process-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const laneSpecContract = z
  .object({
    name: specNameContract,
    processes: z.array(laneProcessContract).readonly(),
    browser: z.boolean(),
    bootTimeoutMs: timeoutMsContract,
    env: z.record(z.string().brand<'EnvVarName'>(), contentTextContract),
  })
  .refine((spec) => spec.processes.length > 0, {
    message: 'a lane spec must declare at least one process',
    path: ['processes'],
  })
  .refine(
    (spec) => {
      const claimedRoles = spec.processes
        .map((process) => process.portRole)
        .filter((portRole) => portRole !== null);
      return new Set(claimedRoles).size === claimedRoles.length;
    },
    {
      message: 'two processes cannot claim the same portRole',
      path: ['processes'],
    },
  );

export type LaneSpec = z.infer<typeof laneSpecContract>;
