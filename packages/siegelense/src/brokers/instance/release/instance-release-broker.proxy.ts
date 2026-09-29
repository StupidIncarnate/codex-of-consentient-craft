import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

export const instanceReleaseBrokerProxy = (): {
  setupCurrentRegistry: (params: { json: string }) => void;
  getWrittenRegistry: () => unknown;
  stageNextRegistryWriteFails: (params: { code: string }) => void;
} => {
  const updateProxy = registryUpdateBrokerProxy();

  return {
    setupCurrentRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    stageNextRegistryWriteFails: ({ code }: { code: string }): void => {
      updateProxy.stageNextWriteFails({ code });
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },
  };
};
