/**
 * PURPOSE: Writes one per-request log line to stdout, gated behind DUNGEONMASTER_REQUEST_LOG=1.
 * Its own switch rather than `processDevLogAdapter`'s VERBOSE=1, because this repo's `npm run
 * prod` sets VERBOSE=1 and a line per request would flood that terminal; the siegelense lane turns
 * this on in its api process env (`.dungeonmaster.json` devServer.e2e.processes), so its
 * `api-server.log` records what the server did during a run. Lines carry no `[dev]` prefix — the
 * caller's line leads with its own `[http]` tag.
 *
 * USAGE:
 * processRequestLogAdapter({ line: '[http] info GET /api/guilds 200 12ms' });
 * // Writes the line plus "\n" to stdout when DUNGEONMASTER_REQUEST_LOG=1, no-ops otherwise
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const processRequestLogAdapter = ({ line }: { line: string }): AdapterResult => {
  if (process.env.DUNGEONMASTER_REQUEST_LOG !== '1') return { success: true as const };
  process.stdout.write(`${line}\n`);

  return { success: true as const };
};
