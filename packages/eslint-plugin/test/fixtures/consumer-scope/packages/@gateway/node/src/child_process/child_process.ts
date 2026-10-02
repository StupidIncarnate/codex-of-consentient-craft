/**
 * PURPOSE: Acme consumer's curated child_process gateway surface with extra spawn wrapper.
 *
 * USAGE:
 * import { run, spawnFireAndForget } from '@acme/node/child_process';
 */

export * from 'child_process';
export const run = (): undefined => undefined;
export const spawnFireAndForget = (): undefined => undefined;
