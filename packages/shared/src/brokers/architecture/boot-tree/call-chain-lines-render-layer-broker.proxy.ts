import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const callChainLinesRenderLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();

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
      importsProxy.setupImplementation({ fn: buildImpl(map) });
    },
  };
};
