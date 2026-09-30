import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const callChainLinesRenderLayerBrokerProxy = (): {
  setupSource: ({
    sourceFile,
    content,
  }: {
    sourceFile: string;
    content: string;
  }) => void;
  setupMissing: ({ sourceFile }: { sourceFile: string }) => void;
  setupFileContentsMap: ({ map }: { map: Record<string, string> }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();
  // The renderer also calls architectureExportNameResolveBroker directly to resolve the
  // display token for each imported file. registerMock dispatches by caller-path, so the
  // export-name broker needs its OWN handle registered with the same fs map — sharing the
  // imports proxy's handle alone routes to the wrong dispatch entry at call time.
  const exportNameProxy = architectureExportNameResolveBrokerProxy();

  const buildImpl =
    (map: Record<string, string>) =>
    (filePath: string): string => {
      const fp = String(filePath);
      for (const [suffix, content] of Object.entries(map)) {
        if (fp.endsWith(suffix)) {
          return content;
        }
      }
      throw FileMissingErrorStub({ path: fp });
    };

  return {
    setupSource: ({
      sourceFile,
      content,
    }: {
      sourceFile: string;
      content: string;
    }): void => {
      importsProxy.setupSource({ sourceFile, content });
    },

    setupMissing: ({ sourceFile }: { sourceFile: string }): void => {
      importsProxy.setupMissing({ sourceFile });
    },

    setupFileContentsMap: ({ map }: { map: Record<string, string> }): void => {
      const impl = buildImpl(map);
      importsProxy.setupImplementation({ fn: impl, map });
      exportNameProxy.setupImplementation({ fn: impl });
    },
  };
};
