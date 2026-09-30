import * as ts from '#gateway/npm/typescript';

import { PackageNameStub } from '../../contracts/package-name/package-name.stub';
import { contractFileOwnersReadLayerTransformer } from './contract-file-owners-read-layer-transformer';

const filePath = '/repo/packages/alpha/src/contracts/quest/quest-contract.ts';
const packageName = PackageNameStub({ value: '@repo/alpha' });

const readText = ({
  text,
}: {
  text: string;
}): ReturnType<typeof contractFileOwnersReadLayerTransformer> =>
  contractFileOwnersReadLayerTransformer({
    sourceFile: ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true),
    filePath,
    packageName,
  });

describe('contractFileOwnersReadLayerTransformer', () => {
  describe('object contracts', () => {
    it('VALID: {every kind of key} => classifies own brand, shape reuse, contract ref, plain and getter', () => {
      const result = readText({
        text: [
          'export const questContract = z.object({',
          "  id: z.string().min(1).brand<'QuestId'>(),",
          '  flowId: flowContract.shape.id,',
          '  guildId: guildIdContract,',
          '  title: z.string(),',
          '  get parent() { return questContract.shape.id; },',
          '});',
          'export type Quest = z.infer<typeof questContract>;',
        ].join('\n'),
      });

      expect(result.owners).toStrictEqual([
        {
          ownerName: 'Quest',
          contractName: 'questContract',
          filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.ts',
          packageName: '@repo/alpha',
          typeName: 'Quest',
          schemaText: [
            'z.object({',
            "  id: z.string().min(1).brand<'QuestId'>(),",
            '  flowId: flowContract.shape.id,',
            '  guildId: guildIdContract,',
            '  title: z.string(),',
            '  get parent() { return questContract.shape.id; },',
            '})',
          ].join('\n'),
          fields: [
            { key: 'id', kind: 'own-brand', brandText: 'QuestId' },
            {
              key: 'flowId',
              kind: 'owner-reuse',
              refContractName: 'flowContract',
              refKey: 'id',
            },
            { key: 'guildId', kind: 'contract-ref', refContractName: 'guildIdContract' },
            { key: 'title', kind: 'plain' },
            {
              key: 'parent',
              kind: 'owner-reuse',
              refContractName: 'questContract',
              refKey: 'id',
            },
          ],
        },
      ]);
    });

    it('VALID: {object contract with a trailing brand and no type} => still an owner, without typeName', () => {
      const result = readText({
        text: "export const itemContract = z.object({ id: z.string().brand<'ItemId'>() }).brand<'Item'>();",
      });

      expect(
        result.owners.map(({ ownerName, typeName }) => ({ ownerName, typeName })),
      ).toStrictEqual([{ ownerName: 'Item', typeName: undefined }]);
    });
  });

  describe('standalone brands', () => {
    it('VALID: {a branded string contract} => one standalone brand and no owner', () => {
      const result = readText({
        text: "export const questIdContract = z.string().uuid().brand<'QuestId'>();",
      });

      expect(result).toStrictEqual({
        owners: [],
        standaloneBrands: [
          {
            contractName: 'questIdContract',
            brandText: 'QuestId',
            filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.ts',
            packageName: '@repo/alpha',
          },
        ],
        enums: [],
      });
    });
  });

  describe('enum contracts', () => {
    it('VALID: {a branded z.enum and a bare z.enum} => one enum per const with sorted values and no owner', () => {
      const result = readText({
        text: [
          "export const questStatusContract = z.enum(['open', 'done']).brand<'QuestStatus'>();",
          "export const roleContract = z.enum(['worker', 'admin']);",
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        owners: [],
        standaloneBrands: [
          {
            contractName: 'questStatusContract',
            brandText: 'QuestStatus',
            filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.ts',
            packageName: '@repo/alpha',
          },
        ],
        enums: [
          {
            ownerName: 'QuestStatus',
            contractName: 'questStatusContract',
            filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.ts',
            packageName: '@repo/alpha',
            values: ['done', 'open'],
          },
          {
            ownerName: 'Role',
            contractName: 'roleContract',
            filePath: '/repo/packages/alpha/src/contracts/quest/quest-contract.ts',
            packageName: '@repo/alpha',
            values: ['admin', 'worker'],
          },
        ],
      });
    });

    it('EMPTY: {an enum over an identifier and a non-exported enum} => records no enum', () => {
      const result = readText({
        text: [
          'export const kindContract = z.enum(kindValues);',
          "const hiddenContract = z.enum(['a', 'b']);",
        ].join('\n'),
      });

      expect(result).toStrictEqual({ owners: [], standaloneBrands: [], enums: [] });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {a non-exported object contract and a plain string contract} => records nothing', () => {
      const result = readText({
        text: [
          'const hiddenContract = z.object({ id: z.string() });',
          'export const nameContract = z.string();',
        ].join('\n'),
      });

      expect(result).toStrictEqual({ owners: [], standaloneBrands: [], enums: [] });
    });
  });
});
