/**
 * PURPOSE: Writes dev-mode log lines to stdout gated behind VERBOSE=1 — the sole route server's
 * runtime observability logging takes, per this package's CLAUDE.md.
 *
 * USAGE:
 * processDevLogBroker({message: 'WebSocket client connected'});
 * // Writes "[dev] WebSocket client connected\n" to stdout when VERBOSE=1, no-ops otherwise
 */
import { getEnv, stdout } from '#gateway/node/process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const processDevLogBroker = ({ message }: { message: string }): AdapterResult => {
  if (getEnv('VERBOSE') !== '1') return { success: true as const };
  stdout.write(`[dev] ${message}\n`);

  return { success: true as const };
};
