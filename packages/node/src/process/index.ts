/**
 * PURPOSE: Curated entry for the Node global `process`. `stdout`/`stderr` are exported as the raw
 * `Writable` objects, unchanged; `stdin` is guarded through `readStdinToEnd`; `env` reads go
 * through `getEnv`. Everything else here is a thin, un-added-to pass-through of a same-named
 * `process` member, each its own export so a raw-import lint rule has one name per call site to
 * catch.
 *
 * USAGE:
 * import { stdout, getEnv, cwd, exit, kill } from '@dungeonmaster/node/process';
 */

export { readStdinToEnd } from './read-stdin-to-end';
export { getEnv } from './get-env';

export const { stdout } = process;
export const { stderr } = process;
export const { argv } = process;
export const cwd = (): string => process.cwd();
export const { pid } = process;
export const exit = (code?: number): never => process.exit(code);
export const { platform } = process;
export const { execPath } = process;
export const on = (signal: NodeJS.Signals, handler: () => void): NodeJS.Process =>
  process.on(signal, handler);
export const kill = (targetPid: number, signal?: NodeJS.Signals | number): true =>
  process.kill(targetPid, signal);

export const getExitCode = (): number | string | undefined => process.exitCode;
export const setExitCode = (code: number | string | undefined): void => {
  process.exitCode = code;
};
