import { fsWatchAdapterProxy } from '../../../adapters/fs/watch/fs-watch-adapter.proxy';
import { signalReadBrokerProxy } from '../read/signal-read-broker.proxy';

export const signalWatchBrokerProxy = (): {
  fsWatchProxy: ReturnType<typeof fsWatchAdapterProxy>;
  signalReadProxy: ReturnType<typeof signalReadBrokerProxy>;
} => {
  const fsWatchProxy = fsWatchAdapterProxy();
  const signalReadProxy = signalReadBrokerProxy();

  return {
    fsWatchProxy,
    signalReadProxy,
  };
};
