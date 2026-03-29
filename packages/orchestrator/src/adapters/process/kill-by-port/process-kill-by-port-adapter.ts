/**
 * PURPOSE: Kills all processes listening on a given port using lsof and kill -9
 *
 * USAGE:
 * const result = await processKillByPortAdapter({ port: 3000 });
 * // Returns { killedPids: ProcessPid[] }
 */

import { execSync } from 'child_process';
import {
  processPidContract,
  type ProcessPid,
} from '../../../contracts/process-pid/process-pid-contract';

export const processKillByPortAdapter = ({
  port,
}: {
  port: number;
}): { killedPids: ProcessPid[] } => {
  const pidOutput = (() => {
    try {
      return execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  })();

  if (!pidOutput) {
    return { killedPids: [] };
  }

  const killedPids: ProcessPid[] = [];

  for (const line of pidOutput.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const pid = parseInt(trimmed, 10);

    if (!Number.isInteger(pid) || pid <= 0) {
      continue;
    }

    try {
      execSync(`kill -9 ${pid}`);
      killedPids.push(processPidContract.parse(pid));
    } catch {
      // PID may have already exited between lsof and kill
    }
  }

  return { killedPids };
};
