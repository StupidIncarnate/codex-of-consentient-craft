import { pastedImageMemoryState } from './pasted-image-memory-state';

export const pastedImageMemoryStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    pastedImageMemoryState.clear();
  },
});
