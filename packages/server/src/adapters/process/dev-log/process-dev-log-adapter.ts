/**
 * PURPOSE: Writes dev-mode log lines to stdout gated behind DUNGEONMASTER_ENV=dev
 *
 * USAGE:
 * processDevLogAdapter({message: 'WebSocket client connected'});
 * // Writes "[dev] WebSocket client connected\n" to stdout when DUNGEONMASTER_ENV=dev, no-ops otherwise
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const processDevLogAdapter = ({ message }: { message: string }): AdapterResult => {
  if (process.env.DUNGEONMASTER_ENV !== 'dev') return { success: true as const };
  process.stdout.write(`[dev] ${message}\n`);

  return { success: true as const };
};
