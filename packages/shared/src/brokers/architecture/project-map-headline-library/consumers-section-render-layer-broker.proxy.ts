import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { architectureImportEdgesBrokerProxy } from '../import-edges/architecture-import-edges-broker.proxy';

export const consumersSectionRenderLayerBrokerProxy = (): {
  setup: ({
    projectRoot,
    packages,
    sourceFiles,
  }: {
    projectRoot: AbsoluteFilePath;
    packages: ContentText[];
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const importEdgesProxy = architectureImportEdgesBrokerProxy();

  return {
    setup: ({
      projectRoot,
      packages,
      sourceFiles,
    }: {
      projectRoot: AbsoluteFilePath;
      packages: ContentText[];
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      importEdgesProxy.setup({ projectRoot, packages, sourceFiles });
    },
  };
};
