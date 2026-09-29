/**
 * PURPOSE: Spawns a subprocess whose stdin, stdout and stderr are all pipes, for a caller that talks
 * to the child line by line while it runs: writes a line, reads the lines it answers with, and learns
 * when it exits. Reach for this over `spawnLive` (its stdin is `inherit` or `ignore`, never writable)
 * and over `spawnLongLived` (it hands back only `kill`).
 *
 * USAGE:
 * const child = spawnPiped({ command: 'node', args: ['worker.js'], cwd: '/repo' });
 * child.onStdoutLine((line) => { ... });
 * child.writeLine('{"hello":"world"}');
 * child.onExit(({ code, signal, error }) => { ... });
 * child.kill(); // SIGTERM, once
 *
 * Register `onStdoutLine` and `onStderrLine` in the same tick as the spawn: a line that arrives
 * before its listener exists is dropped, as with any readline interface. `onExit` also fires for a
 * listener added after the exit, with the same report.
 *
 * A spawn that never starts (ENOENT) reports through `onExit` as `{ code: null, signal: null, error }`
 * rather than crashing the process through an unhandled `'error'` event. A write to a child that has
 * already gone (EPIPE) reports the same way instead of throwing on the stdin stream.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

interface ExitReport {
  code: number | null;
  signal: NodeJS.Signals | null;
  error?: NodeJS.ErrnoException;
}

export const spawnPiped = ({
  command,
  args,
  cwd,
  env,
}: {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string | undefined>;
}): {
  writeLine: (line: string) => void;
  endStdin: () => void;
  onStdoutLine: (callback: (line: string) => void) => void;
  onStderrLine: (callback: (line: string) => void) => void;
  onExit: (callback: (report: ExitReport) => void) => void;
  kill: () => void;
} => {
  const child = spawn(command, args, {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    ...(env === undefined ? {} : { env }),
  });

  const { stdin, stdout, stderr } = child;

  const stdoutReader = createInterface({ input: stdout });
  const stderrReader = createInterface({ input: stderr });
  const exitState: {
    report: ExitReport | null;
    listeners: ((report: ExitReport) => void)[];
    // The first report wins: a spawn failure emits 'error' and then 'close', and a dead child's
    // stdin emits EPIPE before its own 'close'; every listener is told once.
    settle: (report: ExitReport) => void;
  } = {
    report: null,
    listeners: [],
    settle: (report): void => {
      if (exitState.report !== null) {
        return;
      }
      exitState.report = report;
      for (const listener of exitState.listeners) {
        listener(report);
      }
    },
  };

  child.on('error', (error: NodeJS.ErrnoException) => {
    exitState.settle({ code: null, signal: null, error });
  });
  stdin.on('error', (error: NodeJS.ErrnoException) => {
    exitState.settle({ code: null, signal: null, error });
  });
  child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
    exitState.settle({ code, signal });
  });

  return {
    writeLine: (line: string): void => {
      stdin.write(`${line}\n`);
    },
    endStdin: (): void => {
      stdin.end();
    },
    onStdoutLine: (callback): void => {
      stdoutReader.on('line', callback);
    },
    onStderrLine: (callback): void => {
      stderrReader.on('line', callback);
    },
    onExit: (callback): void => {
      if (exitState.report === null) {
        exitState.listeners.push(callback);
        return;
      }
      callback(exitState.report);
    },
    kill: (): void => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    },
  };
};
