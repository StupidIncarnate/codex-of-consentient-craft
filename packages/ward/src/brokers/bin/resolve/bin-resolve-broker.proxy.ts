import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';

export const binResolveBrokerProxy = (): {
  setupFound: () => void;
  setupNotFound: () => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupFound: (): void => {
      existsProxy.returns({ result: true });
    },

    setupNotFound: (): void => {
      existsProxy.returns({ result: false });
    },
  };
};
