import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';
import { routeMetadataExtractLayerBrokerProxy } from './route-metadata-extract-layer-broker.proxy';
import { widgetSubtreeRenderLayerBrokerProxy } from './widget-subtree-render-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const responderLinesRenderLayerBrokerProxy = (): {
  setupFlowSource: ({ content }: { content: ContentText }) => void;
  setupFlowMissing: () => void;
  setupFlowImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  const flowImportsProxy = importsInFolderTypeFindLayerBrokerProxy();
  const callChainProxy = callChainLinesRenderLayerBrokerProxy();
  const routeMetadataProxy = routeMetadataExtractLayerBrokerProxy();
  widgetSubtreeRenderLayerBrokerProxy();

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
    setupFlowSource: ({ content }: { content: ContentText }): void => {
      flowImportsProxy.setupSource({ content });
    },

    setupFlowMissing: (): void => {
      flowImportsProxy.setupMissing();
    },

    setupFlowImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      flowImportsProxy.setupImplementation({ fn });
    },

    setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }): void => {
      callChainProxy.setupFileContentsMap({ map });
      routeMetadataProxy.setupImplementation({ fn: buildImpl(map) });
    },
  };
};
