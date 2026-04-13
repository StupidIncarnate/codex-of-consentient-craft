/**
 * PURPOSE: Kills all processes listening on a specific port to clean up leaked servers after playwright runs
 *
 * USAGE:
 * await netKillPortAdapter({ port: networkPortContract.parse(49555) });
 * // Kills any process listening on port 49555, resolves silently if none found
 */

import { exec } from 'child_process';

import type { AdapterResult, NetworkPort } from '@dungeonmaster/shared/contracts';

export const netKillPortAdapter = async ({ port }: { port: NetworkPort }): Promise<AdapterResult> =>
  new Promise((resolve) => {
    exec(`lsof -ti :${String(port)}`, (_error, stdout) => {
      const output = typeof stdout === 'string' ? stdout : '';
      const pids = output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      if (pids.length === 0) {
        resolve({ success: true as const });
        return;
      }

      exec(`kill ${pids.join(' ')}`, () => {
        resolve({ success: true as const });
      });
    });
  });
