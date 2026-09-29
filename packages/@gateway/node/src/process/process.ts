/**
 * PURPOSE: Curated entry for the Node global `process`. Every export lives in its own
 * colocated file with its own `.test.ts`/`.proxy.ts` — a global capture (`stdout`, `stderr`,
 * `argv`, `pid`, `platform`, `execPath`) same as a real wrapper function (`cwd`, `exit`, `on`,
 * `kill`, `getEnv`, `setEnv`, `deleteEnv`, `envSnapshot`, `chdir`, `nextTick`, `emit`,
 * `removeAllListeners`, `readStdinToEnd`, `stdinIsTty`, `getExitCode`, `setExitCode`) — so this file holds only
 * re-exports, never an implementation of its own.
 *
 * USAGE:
 * import { stdout, getEnv, setEnv, envSnapshot, cwd, chdir, exit, kill } from '#gateway/node/process';
 */

export { argv } from './argv/argv';
export { chdir } from './chdir/chdir';
export { cwd } from './cwd/cwd';
export { deleteEnv } from './delete-env/delete-env';
export { emit } from './emit/emit';
export { envSnapshot } from './env-snapshot/env-snapshot';
export { execPath } from './exec-path/exec-path';
export { exit } from './exit/exit';
export { getEnv } from './get-env/get-env';
export { getExitCode } from './get-exit-code/get-exit-code';
export { getPlatform } from './get-platform/get-platform';
export { kill } from './kill/kill';
export { nextTick } from './next-tick/next-tick';
export { on } from './on/on';
export { pid } from './pid/pid';
export { platform } from './platform/platform';
export { readStdinToEnd } from './read-stdin-to-end/read-stdin-to-end';
export { removeAllListeners } from './remove-all-listeners/remove-all-listeners';
export { setEnv } from './set-env/set-env';
export { setExitCode } from './set-exit-code/set-exit-code';
export { stderr } from './stderr/stderr';
export { stdinIsTty } from './stdin-is-tty/stdin-is-tty';
export { stdout } from './stdout/stdout';
