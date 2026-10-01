import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { createRequire } from '#gateway/node/module';

export const installedVersionLayerBrokerProxy = (): {
  setupInstalled: (params: {
    repoRoot: string;
    fromDirectory: string;
    packageName: string;
    versionsByNodeModules: Readonly<Record<string, string>>;
  }) => void;
} => {
  const jsonProxy = readJsonFileIfExistsProxy();

  return {
    // Stages one manifest read per `node_modules` directory inside the repo that Node would search
    // from `fromDirectory`: a manifest holding the given version where `versionsByNodeModules` names
    // that directory, missing everywhere else.
    setupInstalled: ({ repoRoot, fromDirectory, packageName, versionsByNodeModules }): void => {
      const directories = (
        createRequire(`${fromDirectory}/package.json`).resolve.paths(packageName) ?? []
      ).filter((directory) => directory.startsWith(`${repoRoot}/`));
      for (const directory of directories) {
        const path = `${directory}/${packageName}/package.json`;
        const version = versionsByNodeModules[directory];
        if (version === undefined) {
          jsonProxy.missing({ path });
        } else {
          jsonProxy.returnsRaw({
            path,
            rawContents: JSON.stringify({ name: packageName, version }),
          });
        }
      }
    },
  };
};
