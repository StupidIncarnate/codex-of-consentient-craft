import { rateLimitsStateProxy } from '../../../state/rate-limits/rate-limits-state.proxy';

export const RateLimitsGetResponderProxy = (): {
  reset: () => void;
} => {
  const stateProxy = rateLimitsStateProxy();
  return { reset: stateProxy.reset };
};
