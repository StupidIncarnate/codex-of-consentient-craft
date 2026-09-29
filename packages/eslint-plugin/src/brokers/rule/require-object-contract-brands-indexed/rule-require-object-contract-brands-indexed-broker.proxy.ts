import { ownerIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/owner-index/build/owner-index-build-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { layerContractCheckLayerBrokerProxy } from './layer-contract-check-layer-broker.proxy';

const PACKAGES = [
  {
    folder: 'alpha',
    dependencies: '{"@project/beta":"*"}',
    file: 'guild-contract.ts',
    contractFolder: 'guild',
    text: [
      "import { z } from 'zod';",
      'export const guildContract = z.object({',
      "  id: z.string().brand<'GuildId'>(),",
      "}).brand<'Guild'>();",
      'export type Guild = z.infer<typeof guildContract>;',
      '',
    ].join('\n'),
  },
  {
    folder: 'beta',
    dependencies: '{}',
    file: 'quest-contract.ts',
    contractFolder: 'quest',
    text: [
      "import { z } from 'zod';",
      'export const questContract = z.object({',
      "  id: z.string().brand<'QuestId'>(),",
      "}).brand<'Quest'>();",
      'export type Quest = z.infer<typeof questContract>;',
      '',
    ].join('\n'),
  },
] as const;

export const ruleRequireObjectContractBrandsIndexedBrokerProxy = (): {
  setupProject: () => void;
  setupLayerProject: ({
    root,
    contracts,
  }: {
    root: string;
    contracts: readonly { folder: string; file: string; text: string }[];
  }) => void;
  setupMissingFile: ({ filePath }: { filePath: string }) => void;
} => {
  const buildProxy = ownerIndexBuildBrokerProxy();
  const layerProxy = layerContractCheckLayerBrokerProxy();
  const root = '/project/packages';

  return {
    // alpha depends on beta, so `questId` in alpha is a reuse of beta's Quest and `guildId` is a
    // reuse of alpha's own Guild; nothing else in either package is claimed.
    setupProject: (): void => {
      buildProxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: root }),
        folders: PACKAGES.map(({ folder }) => folder),
      });

      for (const { folder, dependencies, file, contractFolder, text } of PACKAGES) {
        const packageDir = AbsoluteFilePathStub({ value: `${root}/${folder}` });
        const contractsDir = `${root}/${folder}/src/contracts`;

        buildProxy.setupPackageJson({
          packageDir,
          json: `{"name":"@project/${folder}","dependencies":${dependencies}}`,
        });
        buildProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
        buildProxy.setupWalkedFolder({
          dirPath: AbsoluteFilePathStub({ value: `${root}/${folder}/src` }),
          folders: ['contracts'],
          files: [],
        });
        buildProxy.setupWalkedFolder({
          dirPath: AbsoluteFilePathStub({ value: contractsDir }),
          folders: [contractFolder],
          files: [],
        });
        buildProxy.setupWalkedFolder({
          dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/${contractFolder}` }),
          folders: [],
          files: [file],
        });
        buildProxy.setupSourceText({
          filePath: AbsoluteFilePathStub({ value: `${contractsDir}/${contractFolder}/${file}` }),
          text,
        });
      }
    },

    // The layer half reads the contract index and the parent file under a root of its own, since
    // each root is indexed once.
    setupLayerProject: ({ root: layerRoot, contracts }): void => {
      layerProxy.setupProject({ root: layerRoot, contracts });
    },

    setupMissingFile: ({ filePath }): void => {
      layerProxy.setupMissingFile({ filePath });
    },
  };
};
