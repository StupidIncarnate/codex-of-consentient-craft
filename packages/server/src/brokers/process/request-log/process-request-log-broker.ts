/**
 * PURPOSE: Writes one per-request log line to stdout, gated behind DUNGEONMASTER_REQUEST_LOG=1.
 * Its own switch rather than `processDevLogBroker`'s VERBOSE=1, because this repo's `npm run
 * prod` sets VERBOSE=1 and a line per request would flood that terminal; the siegelense lane turns
 * this on in its api process env (`.dungeonmaster.json` devServer.e2e.processes), so its
 * `api-server.log` records what the server did during a run. Lines carry no `[dev]` prefix — the
 * caller's line leads with its own `[http]` tag.
 *
 * USAGE:
 * processRequestLogBroker({ line: '[http] info GET /api/guilds 200 12ms' });
 * // Writes the line plus "\n" to stdout when DUNGEONMASTER_REQUEST_LOG=1, no-ops otherwise
 */
import { getEnv, stdout } from '#gateway/node/process';

export const processRequestLogBroker = ({ line }: { line: string }): void => {
  if (getEnv('DUNGEONMASTER_REQUEST_LOG') !== '1') return;
  stdout.write(`${line}\n`);
};
