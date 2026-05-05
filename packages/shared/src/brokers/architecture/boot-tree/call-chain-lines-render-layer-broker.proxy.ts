import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const callChainLinesRenderLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();
  // The renderer also calls architectureExportNameResolveBroker directly to resolve the
  // display token for each imported file. registerMock dispatches by caller-path, so the
  // export-name broker needs its OWN handle registered with the same fs map — sharing the
  // imports proxy's handle alone routes to the wrong dispatch entry at call time.
  const exportNameProxy = architectureExportNameResolveBrokerProxy();

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
    setupSource: ({ content }: { content: ContentText }): void => {
      importsProxy.setupSource({ content });
    },

    setupMissing: (): void => {
      importsProxy.setupMissing();
    },

    setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }): void => {
      const impl = buildImpl(map);
      importsProxy.setupImplementation({ fn: impl });
      exportNameProxy.setupImplementation({ fn: impl });
    },
  };
};
