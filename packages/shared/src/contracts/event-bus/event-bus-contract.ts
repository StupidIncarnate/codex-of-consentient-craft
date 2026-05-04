/**
 * PURPOSE: Defines the EventBus structure linking a state-file singleton's path to the
 * exported symbol name that callers reference for emit/on calls. Detection is by
 * file shape (the exported object literal has both `on` and `emit` members) — repo-
 * agnostic and name-agnostic.
 *
 * USAGE:
 * eventBusContract.parse({
 *   stateFile: '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
 *   exportName: 'orchestrationEventsState',
 * });
 *
 * WHEN-TO-USE: Bus-discovery layer brokers and the boot-tree renderer's inline
 * `bus→` / `bus←` annotations.
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const eventBusContract = z.object({
  stateFile: absoluteFilePathContract,
  exportName: contentTextContract,
});

export type EventBus = z.infer<typeof eventBusContract>;
