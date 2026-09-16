import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

export const instanceReleaseBrokerProxy = (): {
  setupCurrentRegistry: (params: { json: string }) => void;
  getWrittenRegistry: () => unknown;
} => {
  const updateProxy = registryUpdateBrokerProxy();

  return {
    setupCurrentRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },
  };
};
