import { astFieldListOwnersTransformer } from './ast-field-list-owners-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const localList = (): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.VariableDeclaration,
    declarations: [
      {
        type: TsestreeNodeType.VariableDeclarator,
        id: { type: TsestreeNodeType.Identifier, name: 'treeNodeFields' },
      },
    ],
  });

const ownerSpreading = ({
  list,
  member,
}: {
  list: string;
  member: string;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.ExportNamedDeclaration,
    declaration: {
      type: TsestreeNodeType.VariableDeclaration,
      declarations: [
        {
          type: TsestreeNodeType.VariableDeclarator,
          id: { type: TsestreeNodeType.Identifier, name: 'treeNodeContract' },
          init: {
            type: TsestreeNodeType.CallExpression,
            arguments: [
              {
                type: TsestreeNodeType.ObjectExpression,
                properties: [
                  {
                    type: TsestreeNodeType.SpreadElement,
                    argument: {
                      type: TsestreeNodeType.MemberExpression,
                      object: { type: TsestreeNodeType.Identifier, name: list },
                      property: { type: TsestreeNodeType.Identifier, name: member },
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  });

describe('astFieldListOwnersTransformer', () => {
  describe('a local field list spread into an owner', () => {
    it('VALID: {...treeNodeFields.shape in treeNodeContract} => maps the list to its owner', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localList(), ownerSpreading({ list: 'treeNodeFields', member: 'shape' })],
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([['treeNodeFields', 'treeNodeContract']]);
    });
  });

  describe('a spread that is not a local field list', () => {
    it('EMPTY: {the spread names an imported const} => returns an empty map', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localList(), ownerSpreading({ list: 'importedFields', member: 'shape' })],
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {the spread reads a member other than shape} => returns an empty map', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localList(), ownerSpreading({ list: 'treeNodeFields', member: 'options' })],
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {no owner spreads anything} => returns an empty map', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          localList(),
          {
            type: TsestreeNodeType.ExportNamedDeclaration,
            declaration: {
              type: TsestreeNodeType.VariableDeclaration,
              declarations: [
                {
                  type: TsestreeNodeType.VariableDeclarator,
                  id: { type: TsestreeNodeType.Identifier, name: 'plainContract' },
                },
              ],
            },
          },
        ],
      });

      const result = astFieldListOwnersTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });
  });
});
