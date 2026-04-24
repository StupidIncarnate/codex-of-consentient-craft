import { smoketestRunState } from './smoketest-run-state';

export const smoketestRunStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    smoketestRunState.end();
  },
});
