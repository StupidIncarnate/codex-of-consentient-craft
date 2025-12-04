import { sessionIsNewBrokerProxy } from '../../../brokers/session/is-new/session-is-new-broker.proxy';

export const HookSessionStartResponderProxy = (): {
  setupIsNewSession: (params: { isNew: boolean }) => void;
} => {
  const sessionProxy = sessionIsNewBrokerProxy();

  return {
    setupIsNewSession: ({ isNew }: { isNew: boolean }): void => {
      if (isNew) {
        sessionProxy.setupFileNotFound();
      } else {
        // Use >= 1024 bytes to represent a resumed session (see isNewSessionGuard threshold)
        sessionProxy.setupFileExists({ size: 2000 });
      }
    },
  };
};
