/**
 * PURPOSE: Tracks whether any web client is currently connected — gates the cross-guild execution queue runner so quests only advance while someone is watching
 *
 * USAGE:
 * webPresenceState.setPresent({ isPresent: true });
 * webPresenceState.getIsPresent();
 * webPresenceState.onChange(handler);
 * webPresenceState.offChange(handler);
 */

type ChangeHandler = ({ isPresent }: { isPresent: boolean }) => void;

const state: {
  isPresent: boolean;
  handlers: Set<ChangeHandler>;
} = {
  isPresent: false,
  handlers: new Set(),
};

export const webPresenceState = {
  setPresent: ({ isPresent }: { isPresent: boolean }): void => {
    if (state.isPresent === isPresent) {
      return;
    }
    state.isPresent = isPresent;
    for (const handler of state.handlers) {
      handler({ isPresent });
    }
  },

  getIsPresent: (): boolean => state.isPresent,

  onChange: (handler: ChangeHandler): void => {
    state.handlers.add(handler);
  },

  offChange: (handler: ChangeHandler): void => {
    state.handlers.delete(handler);
  },

  clear: (): void => {
    state.isPresent = false;
    state.handlers.clear();
  },
};
