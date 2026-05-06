import { rateLimitsBootstrapState } from './rate-limits-bootstrap-state';

export const rateLimitsBootstrapStateProxy = (): {
  reset: () => void;
} => ({
  reset: (): void => {
    rateLimitsBootstrapState.clear();
  },
});
