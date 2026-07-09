/**
 * PURPOSE: In-memory mirror of the Node dispatcher's play/pause mode for the server process —
 * the loop checks getIsPlaying() between steps as its graceful pause point, and the bootstrap
 * subscribes onChange to kick the runner when play is pressed. The file at
 * <dungeonmasterHome>/dispatch-state.json stays the cross-process source of truth; this mirror
 * exists so the loop never has to hit disk per step.
 *
 * setPlaying notifies onChange subscribers on EVERY call, not only on a value transition. Play is
 * a command, not just a state edge: a quest can become ready (e.g. its dependency completes) while
 * the dispatcher is already 'playing', so pressing play/resume again must re-notify subscribers so
 * the runner re-scans. Swallowing an already-playing press left ready work items stuck until the
 * next unrelated wake. Redundant notifications are idempotent downstream (the runner's kick is
 * single-flight; the loop returns immediately when paused; the WS broadcast re-sends the same state).
 *
 * USAGE:
 * orchestrationDispatchState.setPlaying({ isPlaying: true });
 * orchestrationDispatchState.getIsPlaying();
 * orchestrationDispatchState.onChange(handler);
 * orchestrationDispatchState.offChange(handler);
 */

type ChangeHandler = ({ isPlaying }: { isPlaying: boolean }) => void;

const state: {
  isPlaying: boolean;
  handlers: Set<ChangeHandler>;
} = {
  isPlaying: false,
  handlers: new Set(),
};

export const orchestrationDispatchState = {
  setPlaying: ({ isPlaying }: { isPlaying: boolean }): void => {
    state.isPlaying = isPlaying;
    for (const handler of state.handlers) {
      handler({ isPlaying });
    }
  },

  getIsPlaying: (): boolean => state.isPlaying,

  onChange: (handler: ChangeHandler): void => {
    state.handlers.add(handler);
  },

  offChange: (handler: ChangeHandler): void => {
    state.handlers.delete(handler);
  },

  clear: (): void => {
    state.isPlaying = false;
    state.handlers.clear();
  },
};
