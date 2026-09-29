import { nowProxy } from '../now/now.proxy';

// nowIso reads the same Date.now() clock as now, so staging goes through now's own proxy: one
// clock, one staging, whichever of the two a caller reads.
export const nowIsoProxy = (): {
  setupNow: (params: { ms: number }) => void;
  setupNowOnce: (params: { ms: number }) => void;
} => {
  const clockProxy = nowProxy();

  return {
    setupNow: ({ ms }: { ms: number }): void => {
      clockProxy.setupNow({ ms });
    },

    setupNowOnce: ({ ms }: { ms: number }): void => {
      clockProxy.setupNowOnce({ ms });
    },
  };
};
