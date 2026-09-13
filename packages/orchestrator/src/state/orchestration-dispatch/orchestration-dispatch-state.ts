/**
 * PURPOSE: In-memory mirror of the Node dispatcher's play/pause mode AND of the rate-limit
 * guardrail's hold, for the server process — the loop checks getIsPlaying() between steps as its
 * graceful pause point, and the bootstrap subscribes onChange to kick the runner when play is
 * pressed. The file at <dungeonmasterHome>/dispatch-state.json stays the cross-process source of
 * truth; this mirror exists so the loop never has to hit disk per step.
 *
 * getIsPlaying() reports the CONJUNCTION: the user asked to play AND no hold is live. The two are
 * tracked separately so neither can erase the other — setPlaying leaves a hold standing, and
 * setHold leaves the user's intent standing, so a queue held at 93% resumes on its own the moment
 * the window resets without the user having to press anything.
 *
 * setPlaying notifies onChange subscribers on EVERY call, not only on a value transition. Play is
 * a command, not just a state edge: a quest can become ready (e.g. its dependency completes) while
 * the dispatcher is already 'playing', so pressing play/resume again must re-notify subscribers so
 * the runner re-scans. Swallowing an already-playing press left ready work items stuck until the
 * next unrelated wake. Redundant notifications are idempotent downstream (the runner's kick is
 * single-flight; the loop returns immediately when paused; the WS broadcast re-sends the same state).
 *
 * setHold notifies only on a CHANGE, which is the opposite rule and deliberate: it is called on
 * every poll tick with the same value, so notifying each time would kick the runner every few
 * seconds forever. The edge that matters is a hold being lifted, and that one still fires.
 *
 * USAGE:
 * orchestrationDispatchState.setPlaying({ isPlaying: true });
 * orchestrationDispatchState.setHold({ hold: null });
 * orchestrationDispatchState.getIsPlaying();
 * orchestrationDispatchState.onChange(handler);
 * orchestrationDispatchState.offChange(handler);
 */

import type { DispatchHold } from '@dungeonmaster/shared/contracts';

type ChangeHandler = ({ isPlaying }: { isPlaying: boolean }) => void;

const state: {
  isPlaying: boolean;
  hold: DispatchHold | null;
  handlers: Set<ChangeHandler>;
} = {
  isPlaying: false,
  hold: null,
  handlers: new Set(),
};

export const orchestrationDispatchState = {
  setPlaying: ({ isPlaying }: { isPlaying: boolean }): void => {
    state.isPlaying = isPlaying;
    for (const handler of state.handlers) {
      handler({ isPlaying });
    }
  },

  setHold: ({ hold }: { hold: DispatchHold | null }): void => {
    const previousHeldAt = state.hold?.heldAt ?? null;
    const nextHeldAt = hold?.heldAt ?? null;
    state.hold = hold;

    if (previousHeldAt === nextHeldAt) {
      return;
    }

    for (const handler of state.handlers) {
      handler({ isPlaying: state.isPlaying && hold === null });
    }
  },

  getHold: (): DispatchHold | null => state.hold,

  getIsPlaying: (): boolean => state.isPlaying && state.hold === null,

  // What the USER asked for, ignoring the guardrail. The queue UI reads this to keep the play
  // button lit while a hold is standing — a button that flipped back to "paused" would read as the
  // press having failed, and the user would press it again.
  getIsPlayRequested: (): boolean => state.isPlaying,

  onChange: (handler: ChangeHandler): void => {
    state.handlers.add(handler);
  },

  offChange: (handler: ChangeHandler): void => {
    state.handlers.delete(handler);
  },

  clear: (): void => {
    state.isPlaying = false;
    state.hold = null;
    state.handlers.clear();
  },
};
