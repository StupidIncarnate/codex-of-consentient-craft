import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { npmModuleExportShapeBrokerProxy } from '../../npm-module/export-shape/npm-module-export-shape-broker.proxy';
import { specifierResolvesLayerBrokerProxy } from './specifier-resolves-layer-broker.proxy';
import { subpathFoldersOwnedLayerBrokerProxy } from './subpath-folders-owned-layer-broker.proxy';

export const passthroughPlanLayerBrokerProxy = (): {
  setupOwnSubpathFolders: (params: {
    ownSrcRoot: string;
    barrels: Readonly<Record<string, string>>;
  }) => void;
} => {
  const entriesProxy = readdirEntriesProxy();
  const fileProxy = readFileProxy();
  const ownedProxy = subpathFoldersOwnedLayerBrokerProxy();
  npmModuleExportShapeBrokerProxy();
  specifierResolvesLayerBrokerProxy();

  return {
    // Our own gateway holds exactly these folders, each with the given barrel.
    setupOwnSubpathFolders: ({ ownSrcRoot, barrels }): void => {
      entriesProxy.returns({
        path: ownSrcRoot,
        entries: Object.keys(barrels).map((name) => ({ name, kind: 'directory' as const })),
      });
      ownedProxy.setupBarrels({ srcRoot: ownSrcRoot, barrels });
      for (const [folder, contents] of Object.entries(barrels)) {
        fileProxy.returns({ path: `${ownSrcRoot}/${folder}/${folder}.ts`, contents });
      }
    },
  };
};
