/**
 * PURPOSE: Writes dev-mode log lines to stdout gated behind VERBOSE=1
 *
 * USAGE:
 * processDevLogAdapter({message: 'WebSocket client connected'});
 * // Writes "[dev] WebSocket client connected\n" to stdout when VERBOSE=1, no-ops otherwise
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const processDevLogAdapter = ({ message }: { message: string }): AdapterResult => {
  if (process.env.VERBOSE !== '1') return { success: true as const };
  process.stdout.write(`[dev] ${message}\n`);

  return { success: true as const };
};
