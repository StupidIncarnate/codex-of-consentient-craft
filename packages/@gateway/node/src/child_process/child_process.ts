/**
 * PURPOSE: Curated surface for the Node built-in 'child_process'. No raw `spawn`/`exec`/`execSync`
 * leaves this module — every caller in the repo reaches a subprocess through one of the shapes
 * below, chosen for how it needs the output, whether it needs the live process handle, and how
 * long the process lives.
 *
 * USAGE:
 * import { run, runSync, stream, streamLines, spawnDetached, spawnLongLived, spawnLive, runFireAndForget, RunNotFoundError } from '#gateway/node/child_process';
 */

export * from 'child_process';
export { run } from './run/run';
export { runFireAndForget } from './run-fire-and-forget/run-fire-and-forget';
export { RunNotFoundError } from './run-not-found-error/run-not-found-error';
export { runSync } from './run-sync/run-sync';
export { spawnDetached } from './spawn-detached/spawn-detached';
export { spawnLive } from './spawn-live/spawn-live';
export { spawnLongLived } from './spawn-long-lived/spawn-long-lived';
export { stream } from './stream/stream';
export { streamLines } from './stream-lines/stream-lines';
