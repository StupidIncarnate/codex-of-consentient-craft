/**
 * PURPOSE: The two built-in lane specs, as raw (unbranded) data — `dungeonmaster-web` (api + web,
 * `browser: true`) and `dungeonmaster-headless` (api only, `browser: false`), mirroring
 * `packages/web/test/siege-driver/siege-lane.ts`'s measured env blocks, its `dev:no-watch` choice
 * for the api process and its `DUNGEONMASTER_WEB_PORT` requirement for the web process. `{apiPort}`
 * and `{webPort}` are placeholders a later boot broker substitutes into `args`, `env` and
 * `readyPath`; nothing here computes a port. Statics may import only other statics, so this file
 * never calls `laneSpecContract.parse` — `lane-spec-find-broker` is what brands an entry into a
 * `LaneSpec`. `dungeonmaster-headless.processes` carries the SAME `API_PROCESS` object reference
 * `dungeonmaster-web` carries, rather than a second hand-written copy of it, so a change to the api
 * process reaches both specs by construction and the two cannot drift apart.
 *
 * USAGE:
 * laneSpecStatics.specs['dungeonmaster-headless'].browser;
 * // Returns false
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';

import { driverStatics } from '../driver/driver-statics';

const API_PROCESS = {
  name: 'api',
  command: 'npm',
  args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
  portRole: 'api',
  readyPath: '/api/guilds',
  logFileName: locationsStatics.siegelense.apiLog,
  env: {
    DUNGEONMASTER_HOME: '{home}',
    HOME: '{home}',
    CLAUDE_CLI_PATH: '{fakeClaudeCliPath}',
    FAKE_CLAUDE_QUEUE_DIR: '{claudeQueueDir}',
    FAKE_WARD_QUEUE_DIR: '{wardQueueDir}',
    WARD_CLI_PATH: '{fakeWardCliPath}',
    E2E_SIGNAL_BACK_HTTP: '1',
    DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
  },
} as const;

const WEB_PROCESS = {
  name: 'web',
  command: 'npm',
  args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
  portRole: 'web',
  readyPath: '/',
  logFileName: locationsStatics.siegelense.webLog,
  env: {
    DUNGEONMASTER_WEB_PORT: '{webPort}',
  },
} as const;

export const laneSpecStatics = {
  specs: {
    'dungeonmaster-web': {
      name: 'dungeonmaster-web',
      // The SAME API_PROCESS reference the headless spec below carries — one definition, so a
      // change to the api process reaches both specs by construction and the two cannot drift.
      processes: [API_PROCESS, WEB_PROCESS],
      browser: true,
      bootTimeoutMs: driverStatics.boot.defaultTimeoutMs,
      env: { DUNGEONMASTER_PORT: '{apiPort}' },
    },
    'dungeonmaster-headless': {
      name: 'dungeonmaster-headless',
      processes: [API_PROCESS],
      browser: false,
      bootTimeoutMs: driverStatics.boot.defaultTimeoutMs,
      env: { DUNGEONMASTER_PORT: '{apiPort}' },
    },
  },
} as const;
