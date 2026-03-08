import { designProcessState } from './design-process-state';

export const designProcessStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    designProcessState.clear();
  },
});
