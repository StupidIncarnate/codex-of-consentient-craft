/**
 * PURPOSE: Curated entry for the Node global `process`. Every export lives in its own
 * colocated file with its own `.test.ts`/`.proxy.ts` — a global capture (`stdout`, `stderr`,
 * `argv`, `pid`, `platform`, `execPath`) same as a real wrapper function (`cwd`, `exit`, `on`,
 * `kill`, `getEnv`, `readStdinToEnd`, `getExitCode`, `setExitCode`) — so this file holds only
 * re-exports, never an implementation of its own.
 *
 * USAGE:
 * import { stdout, getEnv, cwd, exit, kill } from '#gateway/node/process';
 */

export { argv } from './argv/argv';
export { cwd } from './cwd/cwd';
export { execPath } from './exec-path/exec-path';
export { exit } from './exit/exit';
export { getEnv } from './get-env/get-env';
export { getExitCode } from './get-exit-code/get-exit-code';
export { kill } from './kill/kill';
export { on } from './on/on';
export { pid } from './pid/pid';
export { platform } from './platform/platform';
export { readStdinToEnd } from './read-stdin-to-end/read-stdin-to-end';
export { setExitCode } from './set-exit-code/set-exit-code';
export { stderr } from './stderr/stderr';
export { stdout } from './stdout/stdout';
