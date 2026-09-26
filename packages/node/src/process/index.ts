/**
 * PURPOSE: Curated entry for the Node global `process`. Every export lives in its own
 * colocated file with its own `.test.ts`/`.proxy.ts` — a global capture (`stdout`, `stderr`,
 * `argv`, `pid`, `platform`, `execPath`) same as a real wrapper function (`cwd`, `exit`, `on`,
 * `kill`, `getEnv`, `readStdinToEnd`, `getExitCode`, `setExitCode`) — so this file holds only
 * re-exports, never an implementation of its own.
 *
 * USAGE:
 * import { stdout, getEnv, cwd, exit, kill } from '@dungeonmaster/node/process';
 */

export { readStdinToEnd } from './read-stdin-to-end';
export { getEnv } from './get-env';
export { cwd } from './cwd';
export { exit } from './exit';
export { on } from './on';
export { kill } from './kill';
export { getExitCode } from './get-exit-code';
export { setExitCode } from './set-exit-code';
export { stdout } from './stdout';
export { stderr } from './stderr';
export { argv } from './argv';
export { pid } from './pid';
export { platform } from './platform';
export { execPath } from './exec-path';
