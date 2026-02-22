import { layerConstraintsState } from './layer-constraints-state';

export const layerConstraintsStateProxy = (): {
  setup: () => void;
} => ({
  setup: (): void => {
    // Reset state before each test
    layerConstraintsState.clear();
  },
});
