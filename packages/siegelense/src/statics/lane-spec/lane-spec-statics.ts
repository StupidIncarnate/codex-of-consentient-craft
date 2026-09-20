/**
 * PURPOSE: The two built-in lane specs, as raw (unbranded) data — `dungeonmaster-stack` (api + web,
 * `browser: true`) and `dungeonmaster-api` (api only, `browser: false`), mirroring
 * `packages/web/test/siege-driver/siege-lane.ts`'s measured env blocks, its `dev:no-watch` choice
 * for the api process and its `DUNGEONMASTER_WEB_PORT` requirement for the web process. `{apiPort}`,
 * `{webPort}`, `{home}`, `{claudeQueueDir}` and `{wardQueueDir}` are placeholders `lane-boot-broker`
 * substitutes into `args`, `env` and `readyPath` once an instance exists to claim real values for
 * them; nothing here computes a port or mints a home. `CLAUDE_CLI_PATH` and `WARD_CLI_PATH` are
 * deliberately ABSENT from `API_PROCESS.env`: the fake-CLI binaries they would need to name live
 * under `packages/web/test/**` and `packages/orchestrator/test-fixtures/**`, neither shipped in this
 * package's published `dist/` (see `package.json`'s `files`) nor a complete filename/dirname
 * `locationsStatics` can hold. A caller supplies them instead, via its own inherited
 * `CLAUDE_CLI_PATH`/`WARD_CLI_PATH` — `lane-boot-broker.ts`'s merge-precedence comment says how that
 * survives, and its `requiresFakeAgentCli` check (below) is what refuses to boot rather than fall
 * through to the real binaries when neither is supplied. Statics may
 * import only other statics, so this file never calls `laneSpecContract.parse` —
 * `lane-spec-find-broker` is what brands an entry into a `LaneSpec`. `dungeonmaster-api.processes`
 * carries the SAME `API_PROCESS` object reference `dungeonmaster-stack` carries, rather than a second
 * hand-written copy of it, so a change to the api process reaches both specs by construction and the
 * two cannot drift apart. Both set `requiresFakeAgentCli: true` for the same reason: `browser: false`
 * changes only whether Chromium rides along, and both specs' `processes` still include `API_PROCESS`
 * — the one that dispatches quests through `claude`/`dungeonmaster-ward` — so a browserless boot
 * needs the stub exactly as much as a browsered one does.
 *
 * USAGE:
 * laneSpecStatics.specs['dungeonmaster-api'].browser;
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
    FAKE_CLAUDE_QUEUE_DIR: '{claudeQueueDir}',
    FAKE_WARD_QUEUE_DIR: '{wardQueueDir}',
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
    'dungeonmaster-stack': {
      name: 'dungeonmaster-stack',
      // The SAME API_PROCESS reference the headless spec below carries — one definition, so a
      // change to the api process reaches both specs by construction and the two cannot drift.
      processes: [API_PROCESS, WEB_PROCESS],
      browser: true,
      bootTimeoutMs: driverStatics.boot.defaultTimeoutMs,
      env: { DUNGEONMASTER_PORT: '{apiPort}' },
      requiresFakeAgentCli: true,
    },
    'dungeonmaster-api': {
      name: 'dungeonmaster-api',
      processes: [API_PROCESS],
      browser: false,
      bootTimeoutMs: driverStatics.boot.defaultTimeoutMs,
      env: { DUNGEONMASTER_PORT: '{apiPort}' },
      requiresFakeAgentCli: true,
    },
  },
} as const;
