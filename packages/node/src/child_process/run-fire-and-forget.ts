/**
 * PURPOSE: Runs a shell command and returns immediately, for a caller that genuinely never wants
 * the result — opening a URL in the OS browser. Reach for this over every other export here when
 * there is no exit code, no output and no process handle a caller could ever use.
 *
 * USAGE:
 * runFireAndForget({ command: 'open http://localhost:3737' });
 * // Spawns the command in a shell; returns nothing
 *
 * `exec`'s own `ChildProcess` still emits `'error'` when the command never starts (ENOENT for
 * `open`/`xdg-open`/`start`), and Node's default for an unlistened `'error'` event is to crash the
 * process — so this attaches a listener that logs instead, closing the gap the adapter this
 * replaces shipped with (a bad command failed silently by crashing).
 */

import { exec } from 'child_process';

export const runFireAndForget = ({ command }: { command: string }): void => {
  const child = exec(command);
  child.on('error', (error: Error) => {
    process.stderr.write(
      `[child_process/runFireAndForget] "${command}" failed to start: ${String(error)}\n`,
    );
  });
};
