import { startupFilesFindLayerBrokerProxy } from './startup-files-find-layer-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { responderLinesRenderLayerBrokerProxy } from './responder-lines-render-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureBootTreeBrokerProxy = (): {
  setupStartupFiles: ({ names }: { names: string[] }) => void;
  setupNoStartupFiles: () => void;
  setupFileContentsMap: ({ map }: { map: Record<string, ContentText> }) => void;
} => {
  const startupProxy = startupFilesFindLayerBrokerProxy();
  const flowImportsProxy = importsInFolderTypeFindLayerBrokerProxy();
  const responderProxy = responderLinesRenderLayerBrokerProxy();

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
      responderProxy.setupFlowImplementation({ fn: impl });
      responderProxy.setupAdapterImplementation({ fn: impl });
    },
  };
};
