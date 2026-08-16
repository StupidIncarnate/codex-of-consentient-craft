import { discoverIgnoreState } from './discover-ignore-state';

export const discoverIgnoreStateProxy = (): {
  setupClear: () => void;
} => ({
  setupClear: (): void => {
    discoverIgnoreState.clear();
  },
});
