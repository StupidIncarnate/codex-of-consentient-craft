import { startupFilesFindLayerBrokerProxy } from './startup-files-find-layer-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { responderLinesRenderLayerBrokerProxy } from './responder-lines-render-layer-broker.proxy';
import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { architectureWidgetTreeBrokerProxy } from '../widget-tree/architecture-widget-tree-broker.proxy';
import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { architectureWsEdgesBrokerProxy } from '../ws-edges/architecture-ws-edges-broker.proxy';
import { architectureEventBusBrokerProxy } from '../event-bus/architecture-event-bus-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureBootTreeBrokerProxy = (): {
  setupStartupFiles: ({ names }: { names: string[] }) => void;
  setupNoStartupFiles: () => void;
  setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  const startupProxy = startupFilesFindLayerBrokerProxy();
  const flowImportsProxy = importsInFolderTypeFindLayerBrokerProxy();
  const responderProxy = responderLinesRenderLayerBrokerProxy();
  // Boot-tree calls architectureExportNameResolveBroker for startup, flow names, and the
  // flow header line. Its fs-read-file fake is the same one the rest of the boot-tree
  // proxies share, so the file-contents map covers all of them.
  architectureExportNameResolveBrokerProxy();
  architectureWidgetTreeBrokerProxy();
  architectureEdgeGraphBrokerProxy();
  architectureWsEdgesBrokerProxy();
  // Event-bus discovery walks `state/` folders independently. Initialise its proxy
  // so its file walk does not hit unmocked fs adapters when boot-tree tests only
  // set up startup/responder content.
  architectureEventBusBrokerProxy();

  const buildImpl =
    (map: Record<string, ContentText>) =>
    (filePath: ContentText): ContentText => {
      const fp = String(filePath);
      for (const [suffix, content] of Object.entries(map)) {
        if (fp.endsWith(suffix)) {
          return content;
        }
      }
      throw new Error('ENOENT');
    };

  return {
    setupStartupFiles: ({ names }: { names: string[] }): void => {
      startupProxy.setupFiles({ names });
    },

    setupNoStartupFiles: (): void => {
      startupProxy.setupEmpty();
    },

    setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }): void => {
      const impl = buildImpl(map);
      flowImportsProxy.setupImplementation({ fn: impl });
      responderProxy.setupFileContentsMap({ map });
    },
  };
};
