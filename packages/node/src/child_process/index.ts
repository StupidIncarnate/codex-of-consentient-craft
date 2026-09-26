/**
 * PURPOSE: Curated surface for the Node built-in 'child_process'. No raw `spawn`/`exec`/`execSync`
 * leaves this module — every caller in the repo reaches a subprocess through one of the shapes
 * below, chosen for how it needs the output, whether it needs the live process handle, and how
 * long the process lives.
 *
 * USAGE:
 * import { run, stream, streamLines, spawnDetached, spawnLongLived, spawnLive, runFireAndForget } from '@dungeonmaster/node/child_process';
 */

export * from './run';
export * from './stream';
export * from './stream-lines';
export * from './spawn-detached';
export * from './spawn-long-lived';
export * from './spawn-live';
export * from './run-fire-and-forget';
