import { ownerIndexFileReadTransformer } from './owner-index-file-read-transformer';

const filePath = '/repo/packages/alpha/src/contracts/start-input/start-input-contract.ts';

describe('ownerIndexFileReadTransformer', () => {
  describe('valid input', () => {
    it('VALID: {an object contract with a key pointing at another contract} => keeps that key a contract-ref', () => {
      const result = ownerIndexFileReadTransformer({
        filePath,
        text: [
          'export const startInputContract = z.object({',
          "  questId: z.string().brand<'StartInputQuestId'>(),",
          '  itemId: itemIdContract,',
          '});',
        ].join('\n'),
        packageName: '@repo/alpha',
      });

      expect(result).toStrictEqual({
        owners: [
          {
            ownerName: 'StartInput',
            contractName: 'startInputContract',
            filePath,
            packageName: '@repo/alpha',
            schemaText:
              "z.object({\n  questId: z.string().brand<'StartInputQuestId'>(),\n  itemId: itemIdContract,\n})",
            fields: [
              { key: 'questId', kind: 'own-brand', brandText: 'StartInputQuestId' },
              { key: 'itemId', kind: 'contract-ref', refContractName: 'itemIdContract' },
            ],
          },
        ],
        standaloneBrands: [],
        enums: [],
      });
    });

    it('VALID: {a standalone brand contract} => reads it as a standalone brand of the given package', () => {
      const result = ownerIndexFileReadTransformer({
        filePath,
        text: "export const itemIdContract = z.string().brand<'ItemId'>();",
        packageName: '@repo/alpha',
      });

      expect(result).toStrictEqual({
        owners: [],
        standaloneBrands: [
          {
            contractName: 'itemIdContract',
            brandText: 'ItemId',
            filePath,
            packageName: '@repo/alpha',
          },
        ],
        enums: [],
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {text: ""} => returns an empty read', () => {
      const result = ownerIndexFileReadTransformer({
        filePath,
        text: '',
        packageName: '@repo/alpha',
      });

      expect(result).toStrictEqual({ owners: [], standaloneBrands: [], enums: [] });
    });
  });
});
