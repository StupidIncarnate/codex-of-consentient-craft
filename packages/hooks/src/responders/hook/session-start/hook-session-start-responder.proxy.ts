import { sessionIsNewBrokerProxy } from '../../../brokers/session/is-new/session-is-new-broker.proxy';
import { standardsLoadFilesBrokerProxy } from '../../../brokers/standards/load-files/standards-load-files-broker.proxy';

export const HookSessionStartResponderProxy = (): {
  setupIsNewSession: (params: { isNew: boolean }) => void;
  setupStandardsLoad: (params: { content: string }) => void;
} => {
  const sessionProxy = sessionIsNewBrokerProxy();
  const standardsProxy = standardsLoadFilesBrokerProxy();

  return {
    setupIsNewSession: ({ isNew }: { isNew: boolean }): void => {
      if (isNew) {
        sessionProxy.setupFileNotFound();
      } else {
        // Use >= 1024 bytes to represent a resumed session (see isNewSessionGuard threshold)
        sessionProxy.setupFileExists({ size: 2000 });
      }
    },
    setupStandardsLoad: ({ content }: { content: string }): void => {
      standardsProxy.setupStandardsLoad({ content });
    },
  };
};
