/**
 * PURPOSE: Spawns a long-lived subprocess and returns a kill function without waiting for exit
 *
 * USAGE:
 * const { kill } = childProcessSpawnLongLivedAdapter({ command: 'npx', args: ['vite'], cwd: '/path' });
 * kill(); // Sends SIGTERM to the subprocess
 */

import { spawn } from 'child_process';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const childProcessSpawnLongLivedAdapter = ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
}): { kill: () => void } => {
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    detached: false,
  });

  return {
    kill: (): void => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    },
  };
};
