import { OwnerIndexOwnerStub } from '../../contracts/owner-index-owner/owner-index-owner.stub';
import { inlineEnumsReadLayerTransformer } from './inline-enums-read-layer-transformer';

describe('inlineEnumsReadLayerTransformer', () => {
  describe('object contracts', () => {
    it('VALID: {two enum keys, a plain key and an enum over a variable} => one enum per literal enum key with sorted values', () => {
      const owner = OwnerIndexOwnerStub({
        ownerName: 'WorkItem',
        contractName: 'workItemContract',
        filePath: '/repo/packages/alpha/src/contracts/work-item/work-item-contract.ts',
        packageName: '@repo/alpha',
        schemaText: [
            'z.object({',
            "  role: z.enum(['worker', 'admin']),",
            '  title: z.string(),',
            "  state: z.enum(['open', 'done']).brand<'State'>(),",
            '  kind: z.enum(kinds),',
            '})',
          ].join('\n'),
      });

      expect(inlineEnumsReadLayerTransformer({ owner })).toStrictEqual([
        {
          ownerName: 'WorkItem',
          contractName: 'workItemContract',
          filePath: '/repo/packages/alpha/src/contracts/work-item/work-item-contract.ts',
          packageName: '@repo/alpha',
          key: 'role',
          values: ['admin', 'worker'],
        },
        {
          ownerName: 'WorkItem',
          contractName: 'workItemContract',
          filePath: '/repo/packages/alpha/src/contracts/work-item/work-item-contract.ts',
          packageName: '@repo/alpha',
          key: 'state',
          values: ['done', 'open'],
        },
      ]);
    });

    it('EMPTY: {no enum keys} => returns an empty list', () => {
      const owner = OwnerIndexOwnerStub({
        schemaText: 'z.object({ id: z.string() })',
      });

      expect(inlineEnumsReadLayerTransformer({ owner })).toStrictEqual([]);
    });
  });
});
