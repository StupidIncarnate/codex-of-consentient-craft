/**
 * PURPOSE: Type contracts for the Node dispatch runner — deps shape (wake subscription + loop
 * thunk) and controller shape (start/stop/kick). The runner drives the same get-next-step state
 * machine /dumpster-launch polls, but dispatches by spawning headless Claude CLI children.
 *
 * USAGE:
 * const runner: NodeDispatchRunnerController = questNodeDispatchRunnerBroker(deps);
 * // deps satisfies NodeDispatchRunnerDeps
 */

import { z } from 'zod';

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

// Runtime marker contract — callable function shapes cannot be fully Zod-validated,
// so this schema just asserts the controller has start/stop/kick functions.
export const nodeDispatchRunnerContract = z.object({
  start: z.function(),
  stop: z.function(),
  kick: z.function(),
});
