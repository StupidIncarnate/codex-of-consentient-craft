import { wsServerAdaptersFindLayerBrokerProxy } from './ws-server-adapters-find-layer-broker.proxy';
import { wsGatewayFilesFindLayerBrokerProxy } from './ws-gateway-files-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureWsGatewayBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: string; source: ContentText }[];
  }) => void;
} => {
  // Both child layer brokers share the same listTsFiles/readFile mock surface
  // (singleton registerMock dispatch). Setting up either child's proxy with the
  // same sourceFiles list is sufficient — the second setup overwrites with the
  // same content, which is a no-op.
  const adaptersProxy = wsServerAdaptersFindLayerBrokerProxy();
  const gatewayFilesProxy = wsGatewayFilesFindLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: string; source: ContentText }[];
    }): void => {
      adaptersProxy.setup({ sourceFiles });
      gatewayFilesProxy.setup({ sourceFiles });
    },
  };
};
