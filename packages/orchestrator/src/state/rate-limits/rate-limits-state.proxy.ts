import { rateLimitsState } from './rate-limits-state';

export const rateLimitsStateProxy = (): {
  reset: () => void;
} => ({
  reset: (): void => {
    rateLimitsState.clear();
  },
});
