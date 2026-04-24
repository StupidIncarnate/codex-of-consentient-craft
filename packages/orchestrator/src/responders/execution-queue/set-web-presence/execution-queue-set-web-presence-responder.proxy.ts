import { webPresenceStateProxy } from '../../../state/web-presence/web-presence-state.proxy';

export const ExecutionQueueSetWebPresenceResponderProxy = (): {
  setupEmpty: () => void;
} => {
  const presenceProxy = webPresenceStateProxy();
  presenceProxy.setupEmpty();
  return {
    setupEmpty: (): void => {
      presenceProxy.setupEmpty();
    },
  };
};
