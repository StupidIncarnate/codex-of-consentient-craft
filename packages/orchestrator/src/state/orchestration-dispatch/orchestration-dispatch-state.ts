/**
 * PURPOSE: In-memory mirror of the Node dispatcher's play/pause mode for the server process —
 * the loop checks getIsPlaying() between steps as its graceful pause point, and the bootstrap
 * subscribes onChange to kick the runner when play is pressed. The file at
 * <dungeonmasterHome>/dispatch-state.json stays the cross-process source of truth; this mirror
 * exists so the loop never has to hit disk per step.
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
    if (state.isPlaying === isPlaying) {
      return;
    }
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
