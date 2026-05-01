import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { countBarrelFilesLayerBrokerProxy } from './count-barrel-files-layer-broker.proxy';
import { listStaticsFoldersLayerBrokerProxy } from './list-statics-folders-layer-broker.proxy';
import { consumersSectionRenderLayerBrokerProxy } from './consumers-section-render-layer-broker.proxy';

export const architectureProjectMapHeadlineLibraryBrokerProxy = (): {
  setup: ({
    packageJsonContent,
    barrelFileCounts,
    staticsFolderNames,
    projectRoot,
    packages,
    sourceFiles,
  }: {
    packageJsonContent: ContentText;
    barrelFileCounts: { dirPath: AbsoluteFilePath; fileNames: string[] }[];
    staticsFolderNames: string[];
    projectRoot: AbsoluteFilePath;
    packages: ContentText[];
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();
  const countProxy = countBarrelFilesLayerBrokerProxy();
  const staticsFoldersProxy = listStaticsFoldersLayerBrokerProxy();
  const consumersProxy = consumersSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      packageJsonContent,
      barrelFileCounts,
      staticsFolderNames,
      projectRoot,
      packages,
      sourceFiles,
    }: {
      packageJsonContent: ContentText;
      barrelFileCounts: { dirPath: AbsoluteFilePath; fileNames: string[] }[];
      staticsFolderNames: string[];
      projectRoot: AbsoluteFilePath;
      packages: ContentText[];
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      // consumers proxy must be set up first — it installs a mockImplementation as the base
      // routing function for fsReaddirWithTypesAdapter. The count and statics proxies then
      // queue mockReturnValueOnce entries that take priority over that base implementation
      // for the specific readdir calls they service.
      consumersProxy.setup({ projectRoot, packages, sourceFiles });

      pkgJsonProxy.setupPackageJson({ content: packageJsonContent });

      for (const barrel of barrelFileCounts) {
        countProxy.setupFiles({ dirPath: barrel.dirPath, fileNames: barrel.fileNames });
      }

      if (staticsFolderNames.length > 0) {
        staticsFoldersProxy.setupFolders({ folderNames: staticsFolderNames });
      }
    },
  };
};
