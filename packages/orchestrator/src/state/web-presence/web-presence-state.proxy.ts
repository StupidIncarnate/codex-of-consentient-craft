import { webPresenceState } from './web-presence-state';

export const webPresenceStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    webPresenceState.clear();
  },
});
