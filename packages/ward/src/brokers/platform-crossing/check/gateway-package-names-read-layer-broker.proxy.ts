import { readPackageNameOptionalLayerBrokerProxy } from './read-package-name-optional-layer-broker.proxy';

const FOLDER_NAMES = ['node', 'bin', 'browser'] as const;

export const gatewayPackageNamesReadLayerBrokerProxy = ({
  rootPath,
}: {
  rootPath: string;
}): {
  setupPackageJson: (params: { folderName: (typeof FOLDER_NAMES)[number]; name: string }) => void;
} => {
  const readProxy = readPackageNameOptionalLayerBrokerProxy();

  const pathFor = ({ folderName }: { folderName: (typeof FOLDER_NAMES)[number] }): string =>
    `${rootPath}/packages/@gateway/${folderName}/package.json`;

  // Every gateway folder is absent by default — a fixture repo builds only the packages a test
  // cares about, so the other two must not throw an "unmatched call" error.
  for (const folderName of FOLDER_NAMES) {
    readProxy.setupMissing({ packageJsonPath: pathFor({ folderName }) });
  }

  return {
    setupPackageJson: ({
      folderName,
      name,
    }: {
      folderName: (typeof FOLDER_NAMES)[number];
      name: string;
    }): void => {
      readProxy.setupPackageJson({ packageJsonPath: pathFor({ folderName }), name });
    },
  };
};
