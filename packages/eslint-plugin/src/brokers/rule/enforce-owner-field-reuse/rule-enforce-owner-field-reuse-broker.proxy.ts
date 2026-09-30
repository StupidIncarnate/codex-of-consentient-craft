import { ownerIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/owner-index/build/owner-index-build-broker.proxy';

const contractText = ({
  contractName,
  typeName,
  brand,
  extraFields,
}: {
  contractName: string;
  typeName: string;
  brand: string;
  extraFields: string;
}): string =>
  [
    "import { z } from 'zod';",
    `export const ${contractName} = z.object({`,
    `  id: z.string().brand<'${brand}Id'>(),`,
    extraFields,
    `}).brand<'${typeName}'>();`,
    `export type ${typeName} = z.infer<typeof ${contractName}>;`,
    '',
  ].join('\n');

const PACKAGES = [
  {
    folder: 'alpha',
    dependencies: '{"@project/beta":"*"}',
    contracts: [
      {
        folder: 'guild',
        file: 'guild-contract.ts',
        text: contractText({
          contractName: 'guildContract',
          typeName: 'Guild',
          brand: 'Guild',
          extraFields: "  slug: z.string().brand<'GuildSlug'>(),",
        }),
      },
    ],
  },
  {
    folder: 'beta',
    dependencies: '{}',
    contracts: [
      {
        folder: 'quest',
        file: 'quest-contract.ts',
        text: contractText({
          contractName: 'questContract',
          typeName: 'Quest',
          brand: 'Quest',
          extraFields: "  title: z.string().brand<'QuestTitle'>(),",
        }),
      },
      {
        folder: 'work-item',
        file: 'work-item-contract.ts',
        text: contractText({
          contractName: 'workItemContract',
          typeName: 'WorkItem',
          brand: 'WorkItem',
          extraFields: "  role: z.string().brand<'WorkItemRole'>(),",
        }),
      },
    ],
  },
  {
    folder: 'gamma',
    dependencies: '{}',
    contracts: [
      {
        folder: 'session',
        file: 'session-contract.ts',
        text: contractText({
          contractName: 'sessionContract',
          typeName: 'Session',
          brand: 'Session',
          extraFields: "  label: z.string().brand<'SessionLabel'>(),",
        }),
      },
    ],
  },
] as const;

export const ruleEnforceOwnerFieldReuseBrokerProxy = (): {
  setupProject: () => void;
} => {
  const buildProxy = ownerIndexBuildBrokerProxy();
  const root = '/project/packages';

  return {
    // alpha depends on beta and owns Guild; beta owns Quest and WorkItem; gamma owns Session and is
    // a dependency of nobody, so its owner never claims a name in alpha.
    setupProject: (): void => {
      buildProxy.setupSubfolders({
        dirPath: root,
        folders: PACKAGES.map(({ folder }) => folder),
      });

      for (const { folder, dependencies, contracts } of PACKAGES) {
        const packageDir = `${root}/${folder}`;
        const contractsDir = `${root}/${folder}/src/contracts`;

        buildProxy.setupPackageJson({
          packageDir,
          json: `{"name":"@project/${folder}","dependencies":${dependencies}}`,
        });
        buildProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
        buildProxy.setupWalkedFolder({
          dirPath: `${root}/${folder}/src`,
          folders: ['contracts'],
          files: [],
        });
        buildProxy.setupWalkedFolder({
          dirPath: contractsDir,
          folders: contracts.map((contract) => contract.folder),
          files: [],
        });

        for (const contract of contracts) {
          buildProxy.setupWalkedFolder({
            dirPath: `${contractsDir}/${contract.folder}`,
            folders: [],
            files: [contract.file],
          });
          buildProxy.setupSourceText({
            filePath: `${contractsDir}/${contract.folder}/${contract.file}`,
            text: contract.text,
          });
        }
      }
    },
  };
};
