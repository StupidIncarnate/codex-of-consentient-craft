/**
 * PURPOSE: Single-flight controller for the Node dispatch loop — `kick()` runs the loop once,
 * coalescing kicks that arrive mid-run into one follow-up pass. The bootstrap wires `onWake` to
 * every wake source (play pressed, queue change, quest-outbox mutation) so the runner never
 * sleep-polls.
 *
 * USAGE:
 * const runner = questNodeDispatchRunnerBroker({ onWake, offWake, runLoop });
 * runner.start();
 * await runner.kick();
 */

import { stderr } from '#gateway/node/process';

import type {
  NodeDispatchRunnerController,
  NodeDispatchRunnerDeps,
  NodeDispatchWakeHandler,
} from '../../../contracts/node-dispatch-runner/node-dispatch-runner-contract';

export const questNodeDispatchRunnerBroker = ({
  onWake,
  offWake,
  runLoop,
}: NodeDispatchRunnerDeps): NodeDispatchRunnerController => {
  const internal: {
    running: boolean;
    kickPending: boolean;
    wakeHandler: NodeDispatchWakeHandler | null;
  } = {
    running: false,
    kickPending: false,
    wakeHandler: null,
  };

  const controller: NodeDispatchRunnerController = {
    start: (): void => {
      if (internal.wakeHandler !== null) {
        return;
      }
      internal.wakeHandler = (): void => {
        controller.kick().catch((error: unknown) => {
          stderr.write(`[node-dispatch-runner] kick failed: ${String(error)}\n`);
        });
      };
      onWake({ handler: internal.wakeHandler });
    },

    stop: (): void => {
      if (internal.wakeHandler === null) {
        return;
      }
      offWake({ handler: internal.wakeHandler });
      internal.wakeHandler = null;
    },

    kick: async (): Promise<void> => {
      if (internal.running) {
        internal.kickPending = true;
        return;
      }
      internal.running = true;
      try {
        await runLoop();
      } finally {
        const shouldRekick = internal.kickPending;
        internal.running = false;
        internal.kickPending = false;
        if (shouldRekick) {
          await controller.kick();
        }
      }
    },
  };

  return controller;
};
