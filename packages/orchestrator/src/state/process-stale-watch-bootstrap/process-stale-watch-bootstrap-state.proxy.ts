import { processStaleWatchBootstrapState } from './process-stale-watch-bootstrap-state';

export const processStaleWatchBootstrapStateProxy = (): {
  reset: () => void;
} => ({
  reset: (): void => {
    processStaleWatchBootstrapState.clear();
  },
});
