/**
 * PURPOSE: Wraps node-pty for spawning CLI subprocesses with pseudo-terminal support
 *
 * USAGE:
 * import { nodePtySpawnAdapter } from './node-pty-spawn-adapter';
 * const pty = nodePtySpawnAdapter({
 *   command: 'npx',
 *   args: ['tsx', 'start-cli.ts'],
 *   options: { cwd: FilePathStub({ value: '/tmp/test-project' }) }
 * });
 * pty.onData((data) => console.log(data));
 * pty.write('hello');
 * pty.kill();
 */

import { spawn, type IPty, type IPtyForkOptions } from 'node-pty';
import { ptyDefaultsStatics } from '../../../statics/pty-defaults/pty-defaults-statics';
import type { EnvRecord } from '../../../contracts/env-record/env-record-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { ProcessId } from '../../../contracts/process-id/process-id-contract';
import type { PtyDimension } from '../../../contracts/pty-dimension/pty-dimension-contract';
import type { PtyTerminalName } from '../../../contracts/pty-terminal-name/pty-terminal-name-contract';
import type { SignalName } from '../../../contracts/signal-name/signal-name-contract';
import type { ExitCode } from '../../../contracts/exit-code/exit-code-contract';

export interface NodePtySpawnOptions {
  cwd?: FilePath;
  env?: EnvRecord;
  cols?: PtyDimension;
  rows?: PtyDimension;
  name?: PtyTerminalName;
}

export interface NodePtyInstance {
  /** Writes data to the PTY stdin */
  write: (data: string) => void;
  /** Registers a callback for data events */
  onData: (callback: (data: string) => void) => void;
  /** Registers a callback for exit events */
  onExit: (callback: (exitInfo: { exitCode: ExitCode; signal?: number }) => void) => void;
  /** Kills the PTY process */
  kill: (signal?: SignalName) => void;
  /** Resizes the PTY dimensions */
  resize: (cols: PtyDimension, rows: PtyDimension) => void;
  /** The process ID */
  pid: ProcessId;
}

export const nodePtySpawnAdapter = ({
  command,
  args,
  options,
}: {
  command: string;
  args: string[];
  options?: NodePtySpawnOptions;
}): NodePtyInstance => {
  const ptyOptions: IPtyForkOptions = {
    name: options?.name ?? ptyDefaultsStatics.terminalName,
    cols: options?.cols ?? ptyDefaultsStatics.cols,
    rows: options?.rows ?? ptyDefaultsStatics.rows,
  };

  if (options?.cwd !== undefined) {
    ptyOptions.cwd = options.cwd;
  }

  if (options?.env !== undefined) {
    ptyOptions.env = options.env;
  }

  const pty: IPty = spawn(command, args, ptyOptions);

  return {
    write: (data: string): void => {
      pty.write(data);
    },
    onData: (callback: (data: string) => void): void => {
      pty.onData(callback);
    },
    onExit: (callback: (exitInfo: { exitCode: ExitCode; signal?: number }) => void): void => {
      pty.onExit(callback as (e: { exitCode: number; signal?: number }) => void);
    },
    kill: (signal?: SignalName): void => {
      pty.kill(signal);
    },
    resize: (cols: PtyDimension, rows: PtyDimension): void => {
      pty.resize(cols, rows);
    },
    pid: pty.pid as ProcessId,
  };
};
