/**
 * PURPOSE: Names the process-start functions `bin-program-spawn-ban` watches: the gateway's own
 * curated `@<scope>/node/child_process` exports (real names in
 * `packages/@gateway/node/src/child_process/child_process.ts`) and the raw Node `child_process`
 * functions they wrap.
 * `singleStringRawFunctionNames` is the subset whose one argument is a combined "command args..."
 * string rather than a separate `args` array — `exec`/`execSync`, never `spawn`/`execFile*`/`spawnSync`.
 *
 * USAGE:
 * childProcessFunctionNamesStatics.gatewayFunctionNames.includes('run');
 * // Returns true
 */
export const childProcessFunctionNamesStatics = {
  gatewayFunctionNames: [
    'run',
    'runSync',
    'stream',
    'streamLines',
    'spawnDetached',
    'spawnLongLived',
    'spawnLive',
    'runFireAndForget',
  ],
  rawFunctionNames: ['spawn', 'exec', 'execSync', 'execFile', 'execFileSync', 'spawnSync'],
  singleStringRawFunctionNames: ['exec', 'execSync'],
} as const;
