/**
 * PURPOSE: Answers whether anything is listening on a port right now. The artifact sweep needs it
 * because ports RECUR: the OS can hand a fresh run a port whose stale cache directory is still on
 * disk, and for the few seconds before that run's server writes to it the directory still looks
 * abandoned. Deleting it there breaks a run that is already under way, and the symptom — Vite never
 * becoming ready, so Playwright dies on `Timed out waiting 60000ms from config.webServer` — names
 * nothing that would lead anyone back to a cleanup. A bound port is proof a run owns the artifact,
 * where an mtime is only a guess.
 *
 * Reach for this over netKillPortAdapter when you want to ASK about a port; that one kills what it
 * finds.
 *
 * USAGE:
 * await netPortInUseAdapter({ port: NetworkPortStub({ value: 40000 }) });
 * // Returns true while a process holds the port
 */

import { exec } from 'child_process';

import type { NetworkPort } from '@dungeonmaster/shared/contracts';

export const netPortInUseAdapter = async ({ port }: { port: NetworkPort }): Promise<boolean> =>
  new Promise((resolve) => {
    // Same probe netKillPortAdapter uses to find what to kill. A non-zero exit just means no
    // listener, which is the answer rather than a failure — so the error argument is ignored and
    // the stdout is read either way.
    exec(`lsof -ti :${String(port)}`, (_error, stdout) => {
      const output = typeof stdout === 'string' ? stdout : '';

      resolve(output.trim().length > 0);
    });
  });
