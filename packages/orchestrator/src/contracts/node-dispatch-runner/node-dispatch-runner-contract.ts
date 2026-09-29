/**
 * PURPOSE: Type contracts for the Node dispatch runner — deps shape (wake subscription + loop
 * thunk) and controller shape (start/stop/kick). The runner drives the get-next-step state
 * machine and dispatches by spawning headless Claude CLI children.
 *
 * USAGE:
 * const runner: NodeDispatchRunnerController = questNodeDispatchRunnerBroker(deps);
 * // deps satisfies NodeDispatchRunnerDeps
 */

import { z } from '#gateway/npm/zod';

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export type NodeDispatchWakeHandler = () => void;

export interface NodeDispatchRunnerDeps {
  onWake: ({ handler }: { handler: NodeDispatchWakeHandler }) => void;
  offWake: ({ handler }: { handler: NodeDispatchWakeHandler }) => void;
  runLoop: () => Promise<AdapterResult>;
}

export interface NodeDispatchRunnerController {
  start: () => AdapterResult;
  stop: () => AdapterResult;
  kick: () => Promise<AdapterResult>;
}

// Runtime marker contract — a Zod object schema cannot check callability, so `start`/`stop`/`kick`
// stay out of the parse and are attached only through `NodeDispatchRunnerController` above.
// `.loose()` carries them through `.parse()` unvalidated when a real caller supplies one.
export const nodeDispatchRunnerContract = z.object({}).loose();
