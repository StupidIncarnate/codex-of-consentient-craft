import { execSync, type ExecSyncOptions } from 'child_process';
import type { Buffer } from 'node:buffer';

export type { ExecSyncOptions };

export const childProcessExecSync = ({
  command,
  options,
}: {
  command: string;
  options?: ExecSyncOptions;
}): string | Buffer => {
  try {
    return execSync(command, options);
  } catch (error) {
    throw new Error(`Failed to execute command: ${command}`, { cause: error });
  }
};
