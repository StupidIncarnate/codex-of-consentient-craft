/**
 * PURPOSE: The single, unedited devServer.e2e.processes entry InstallCreateConfigResponder seeds
 * into a fresh .dungeonmaster.json. Exported so a later reader (siegelense's spec-derive broker)
 * can compare a configured process against this literal value and refuse with a named error
 * pointing at devServer.e2e.processes in .dungeonmaster.json, rather than a bare shell
 * "command not found". `env.PORT` shows a consumer how a run's freshly claimed port reaches their
 * app, the same way `{apiPort}` reaches a configured `command` string.
 *
 * USAGE:
 * import {e2eProcessPlaceholderStatics} from './e2e-process-placeholder-statics';
 * const placeholder = e2eProcessPlaceholderStatics.process;
 * // Returns the seeded { name, command, portRole, readyPath, env } entry
 */

export const e2eProcessPlaceholderStatics = {
  process: {
    name: 'app',
    command: 'npm run dev:no-watch',
    portRole: 'api',
    readyPath: '/',
    env: {
      PORT: '{apiPort}',
    },
  },
} as const;
