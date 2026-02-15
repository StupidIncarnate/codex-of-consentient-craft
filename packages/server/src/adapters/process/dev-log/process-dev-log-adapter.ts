/**
 * PURPOSE: Writes dev-mode log lines to stdout gated behind DUNGEONMASTER_ENV=dev
 *
 * USAGE:
 * processDevLogAdapter({message: 'WebSocket client connected'});
 * // Writes "[dev] WebSocket client connected\n" to stdout when DUNGEONMASTER_ENV=dev, no-ops otherwise
 */

export const processDevLogAdapter = ({ message }: { message: string }): void => {
  if (process.env.DUNGEONMASTER_ENV !== 'dev') return;
  process.stdout.write(`[dev] ${message}\n`);
};
