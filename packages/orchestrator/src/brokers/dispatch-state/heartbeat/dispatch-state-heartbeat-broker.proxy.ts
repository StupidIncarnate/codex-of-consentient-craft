import { dispatchStateReadBrokerProxy } from '../read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBrokerProxy } from '../write/dispatch-state-write-broker.proxy';

export const dispatchStateHeartbeatBrokerProxy = (): {
  setupCurrentState: (params: { json: string }) => void;
  setupMissingStateFile: () => void;
  getWrittenContent: () => unknown;
} => {
  const readProxy = dispatchStateReadBrokerProxy();
  const writeProxy = dispatchStateWriteBrokerProxy();

  return {
    setupCurrentState: ({ json }: { json: string }): void => {
      readProxy.setupStateFile({ json });
      writeProxy.setupWriteSuccess();
    },

    setupMissingStateFile: (): void => {
      readProxy.setupMissingFile();
      writeProxy.setupWriteSuccess();
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),
  };
};
