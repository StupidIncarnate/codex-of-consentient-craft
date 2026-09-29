/**
 * PURPOSE: Type contracts for the Node dispatch runner — deps shape (wake subscription + loop
 * thunk) and controller shape (start/stop/kick). The runner drives the get-next-step state
 * machine and dispatches by spawning headless Claude CLI children.
 *
 * USAGE:
 * const runner: NodeDispatchRunnerController = questNodeDispatchRunnerBroker(deps);
 * // deps satisfies NodeDispatchRunnerDeps
 */

export type NodeDispatchWakeHandler = () => void;

export interface NodeDispatchRunnerDeps {
  onWake: ({ handler }: { handler: NodeDispatchWakeHandler }) => void;
  offWake: ({ handler }: { handler: NodeDispatchWakeHandler }) => void;
  runLoop: () => Promise<void>;
}

export interface NodeDispatchRunnerController {
  start: () => void;
  stop: () => void;
  kick: () => Promise<void>;
}
