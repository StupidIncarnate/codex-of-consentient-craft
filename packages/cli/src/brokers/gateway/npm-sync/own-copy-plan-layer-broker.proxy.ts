import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { folderRequirementsLayerBrokerProxy } from './folder-requirements-layer-broker.proxy';
import { subpathFoldersOwnedLayerBrokerProxy } from './subpath-folders-owned-layer-broker.proxy';

export const ownCopyPlanLayerBrokerProxy = (): {
  setupOwnGateway: (params: {
    ownSrcRoot: string;
    folders: Readonly<Record<string, Readonly<Record<string, string>>>>;
  }) => void;
} => {
  const entriesProxy = readdirEntriesProxy();
  const ownedProxy = subpathFoldersOwnedLayerBrokerProxy();
  const requirementsProxy = folderRequirementsLayerBrokerProxy();

  return {
    // Lists every folder at the gateway's src root and stages each folder's whole tree, which also
    // answers its barrel read; a folder with no `<folder>.ts` has that read staged as missing.
    setupOwnGateway: ({ ownSrcRoot, folders }): void => {
      entriesProxy.returns({
        path: ownSrcRoot,
        entries: Object.keys(folders).map((name) => ({ name, kind: 'directory' as const })),
      });
      for (const [folder, files] of Object.entries(folders)) {
        requirementsProxy.setupFolder({ ownSrcRoot, folder, files });
        if (files[`${folder}.ts`] === undefined) {
          ownedProxy.setupBarrels({ srcRoot: ownSrcRoot, barrels: { [folder]: null } });
        }
      }
    },
  };
};
