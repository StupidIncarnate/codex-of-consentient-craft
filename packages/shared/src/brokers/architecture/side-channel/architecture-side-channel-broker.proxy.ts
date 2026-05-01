import { architectureWsEdgesBrokerProxy } from '../ws-edges/architecture-ws-edges-broker.proxy';
import { architectureFileBusEdgesBrokerProxy } from '../file-bus-edges/architecture-file-bus-edges-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { wsEdgesFilterLayerBrokerProxy } from './ws-edges-filter-layer-broker.proxy';
import { fileBusEdgesFilterLayerBrokerProxy } from './file-bus-edges-filter-layer-broker.proxy';
import { sideChannelRenderLayerBrokerProxy } from './side-channel-render-layer-broker.proxy';

export const architectureSideChannelBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const wsProxy = architectureWsEdgesBrokerProxy();
  const fileBusProxy = architectureFileBusEdgesBrokerProxy();
  wsEdgesFilterLayerBrokerProxy();
  fileBusEdgesFilterLayerBrokerProxy();
  sideChannelRenderLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      wsProxy.setup({ sourceFiles });

      const fileBusSourceFiles = sourceFiles.map((f) => ({
        path: f.path,
        source: ContentTextStub({ value: String(f.source) }),
      }));
      fileBusProxy.setup({ sourceFiles: fileBusSourceFiles });
    },
  };
};
