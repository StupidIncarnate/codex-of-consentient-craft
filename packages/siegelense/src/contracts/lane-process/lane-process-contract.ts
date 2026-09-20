/**
 * PURPOSE: One spawnable process inside a lane spec — the shape `siege-lane.ts`'s hardcoded
 * `SERVER_WORKSPACE` / `WEB_WORKSPACE` literals and their env blocks move into once the lane spec
 * becomes data (siegelense-tooling.md line 1939, Part 7 item 17). Chromium is never a `LaneProcess`:
 * it is launched through Playwright rather than spawned, so `laneSpecContract.browser` carries it
 * instead. `portRole` and `readyPath` are both nullable because a process can exist with no HTTP
 * surface to boot-poll — a background worker, for instance — and `args`/`env` stay generic enough
 * to hold this repo's fake-CLI wiring today without naming it in the shape.
 *
 * USAGE:
 * const process = laneProcessContract.parse({
 *   name: 'api',
 *   command: 'npm',
 *   args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
 *   portRole: 'api',
 *   readyPath: '/api/guilds',
 *   logFileName: 'api-server.log',
 *   env: { DUNGEONMASTER_PORT: '{apiPort}' },
 * });
 * // Returns a validated LaneProcess
 */

import { z } from 'zod';

import { contentTextContract, fileNameContract } from '@dungeonmaster/shared/contracts';

import { laneProcessNameContract } from '../lane-process-name/lane-process-name-contract';
import { portRoleContract } from '../port-role/port-role-contract';
import { urlPathContract } from '../url-path/url-path-contract';

export const laneProcessContract = z.object({
  name: laneProcessNameContract,
  command: contentTextContract,
  args: z.array(contentTextContract).readonly(),
  portRole: portRoleContract.nullable(),
  readyPath: urlPathContract.nullable(),
  logFileName: fileNameContract,
  env: z.record(z.string().brand<'EnvVarName'>(), contentTextContract),
});

export type LaneProcess = z.infer<typeof laneProcessContract>;
