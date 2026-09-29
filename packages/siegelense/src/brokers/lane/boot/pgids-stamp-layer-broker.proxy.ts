// PURPOSE: Proxy for pgids-stamp-layer-broker — stages the registry file the stamp reads and
// exposes what it wrote back.
// USAGE: const proxy = pgidsStampLayerBrokerProxy(); proxy.setupRegistry({ json }); proxy.getWrittenContent();

import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

export const pgidsStampLayerBrokerProxy = (): {
  setupRegistry: (params: { json: string }) => void;
  getWrittenContent: () => unknown;
} => {
  const updateProxy = registryUpdateBrokerProxy();

  return {
    setupRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    getWrittenContent: (): unknown => updateProxy.getWrittenContent(),
  };
};
