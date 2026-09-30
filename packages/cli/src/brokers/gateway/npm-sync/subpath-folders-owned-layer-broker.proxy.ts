import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const subpathFoldersOwnedLayerBrokerProxy = (): {
  setupBarrels: (params: {
    srcRoot: string;
    barrels: Readonly<Record<string, string | null>>;
  }) => void;
} => {
  const barrelProxy = readFileIfExistsProxy();

  return {
    // A null barrel stages a folder that holds no `<folder>.ts`.
    setupBarrels: ({ srcRoot, barrels }): void => {
      for (const [folder, contents] of Object.entries(barrels)) {
        const path = `${srcRoot}/${folder}/${folder}.ts`;
        if (contents === null) {
          barrelProxy.missing({ path });
        } else {
          barrelProxy.returns({ path, contents });
        }
      }
    },
  };
};
