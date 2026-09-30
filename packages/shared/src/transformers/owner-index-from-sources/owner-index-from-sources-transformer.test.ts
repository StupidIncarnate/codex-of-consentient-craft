import { OwnerIndexPackageStub } from '../../contracts/owner-index-package/owner-index-package.stub';
import { ownerIndexFromSourcesTransformer } from './owner-index-from-sources-transformer';

const rootDir = '/repo';
const alphaPackage = OwnerIndexPackageStub({
  name: '@repo/alpha',
  dir: '/repo/packages/alpha',
  dependencies: ['@repo/shared'],
});
const sharedPackage = OwnerIndexPackageStub({
  name: '@repo/shared',
  dir: '/repo/packages/shared',
});

const QUEST_TEXT = [
    "import { z } from 'zod';",
    'export const questContract = z.object({',
    "  id: z.string().min(1).brand<'QuestId'>(),",
    "  title: z.string().brand<'QuestTitle'>(),",
    '});',
    'export type Quest = z.infer<typeof questContract>;',
  ].join('\n');
const WORK_ITEM_TEXT = [
    "import { z } from 'zod';",
    'export const workItemContract = z.object({',
    "  id: z.string().brand<'WorkItemId'>(),",
    '  questId: questContract.shape.id,',
    '});',
    'export type WorkItem = z.infer<typeof workItemContract>;',
  ].join('\n');
const START_INPUT_TEXT = [
    "import { z } from 'zod';",
    'export const startInputContract = z.object({',
    "  questId: z.string().min(1).brand<'QuestId'>(),",
    '  itemId: itemIdContract,',
    '});',
  ].join('\n');
const ITEM_ID_TEXT = "export const itemIdContract = z.string().brand<'ItemId'>();";
const LAYER_TEXT = "export const ownerLayerContract = z.object({ id: z.string().brand<'OwnerLayerId'>() });";

describe('ownerIndexFromSourcesTransformer', () => {
  describe('owners', () => {
    it('VALID: {shared quest, alpha work item and start input} => attributes each owner to its package with its fields', () => {
      const result = ownerIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, sharedPackage],
        sources: [
          {
            filePath: '/repo/packages/shared/src/contracts/quest/quest-contract.ts',
            text: QUEST_TEXT,
          },
          {
            filePath: '/repo/packages/alpha/src/contracts/work-item/work-item-contract.ts',
            text: WORK_ITEM_TEXT,
          },
          {
            filePath: '/repo/packages/alpha/src/contracts/start-input/start-input-contract.ts',
            text: START_INPUT_TEXT,
          },
          {
            filePath: '/repo/packages/alpha/src/contracts/item-id/item-id-contract.ts',
            text: ITEM_ID_TEXT,
          },
        ],
      });

      expect({
        owners: result.owners.map(({ ownerName, packageName, typeName, fields }) => ({
          ownerName,
          packageName,
          typeName,
          fields,
        })),
        standaloneBrands: result.standaloneBrands,
        packages: result.packages,
      }).toStrictEqual({
        owners: [
          {
            ownerName: 'Quest',
            packageName: '@repo/shared',
            typeName: 'Quest',
            fields: [
              { key: 'id', kind: 'own-brand', brandText: 'QuestId' },
              { key: 'title', kind: 'own-brand', brandText: 'QuestTitle' },
            ],
          },
          {
            ownerName: 'WorkItem',
            packageName: '@repo/alpha',
            typeName: 'WorkItem',
            fields: [
              { key: 'id', kind: 'own-brand', brandText: 'WorkItemId' },
              {
                key: 'questId',
                kind: 'owner-reuse',
                refContractName: 'questContract',
                refKey: 'id',
              },
            ],
          },
          {
            ownerName: 'StartInput',
            packageName: '@repo/alpha',
            typeName: undefined,
            fields: [
              { key: 'questId', kind: 'own-brand', brandText: 'QuestId' },
              {
                key: 'itemId',
                kind: 'brand-ref',
                refContractName: 'itemIdContract',
                brandText: 'ItemId',
              },
            ],
          },
        ],
        standaloneBrands: [
          {
            contractName: 'itemIdContract',
            brandText: 'ItemId',
            filePath: '/repo/packages/alpha/src/contracts/item-id/item-id-contract.ts',
            packageName: '@repo/alpha',
          },
        ],
        packages: [alphaPackage, sharedPackage],
      });
    });

    it('VALID: {a -layer-contract file} => records no owner for it', () => {
      const result = ownerIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage],
        sources: [
          {
            filePath: '/repo/packages/alpha/src/contracts/owner/owner-layer-contract.ts',
            text: LAYER_TEXT,
          },
        ],
      });

      expect(result.owners).toStrictEqual([]);
    });

    it('VALID: {a test file and a broker beside the contract} => reads only the contract file', () => {
      const result = ownerIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage],
        sources: [
          {
            filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.test.ts',
            text: QUEST_TEXT,
          },
          {
            filePath: '/repo/packages/alpha/src/brokers/quest/quest-broker.ts',
            text: QUEST_TEXT,
          },
        ],
      });

      expect(result.owners).toStrictEqual([]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no sources} => returns an empty index carrying the packages', () => {
      const result = ownerIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage],
        sources: [],
      });

      expect(result).toStrictEqual({
        owners: [],
        standaloneBrands: [],
        enums: [],
        packages: [alphaPackage],
      });
    });
  });

  describe('enums', () => {
    it('VALID: {enum contracts in two packages} => merges them, each attributed to its package', () => {
      const result = ownerIndexFromSourcesTransformer({
        rootDir,
        packages: [alphaPackage, sharedPackage],
        sources: [
          {
            filePath: '/repo/packages/shared/src/contracts/role/role-contract.ts',
            text: "export const roleContract = z.enum(['worker', 'admin']);",
          },
          {
            filePath: '/repo/packages/alpha/src/contracts/mode/mode-contract.ts',
            text: "export const modeContract = z.enum(['fast', 'slow']).brand<'Mode'>();",
          },
        ],
      });

      expect(result.enums).toStrictEqual([
        {
          ownerName: 'Role',
          contractName: 'roleContract',
          filePath: '/repo/packages/shared/src/contracts/role/role-contract.ts',
          packageName: '@repo/shared',
          values: ['admin', 'worker'],
        },
        {
          ownerName: 'Mode',
          contractName: 'modeContract',
          filePath: '/repo/packages/alpha/src/contracts/mode/mode-contract.ts',
          packageName: '@repo/alpha',
          values: ['fast', 'slow'],
        },
      ]);
    });
  });
});
