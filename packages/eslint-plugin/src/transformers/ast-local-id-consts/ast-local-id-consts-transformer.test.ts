import { astLocalIdConstsTransformer } from './ast-local-id-consts-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const localId = (): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.VariableDeclaration,
    declarations: [
      {
        type: TsestreeNodeType.VariableDeclarator,
        id: { type: TsestreeNodeType.Identifier, name: 'workItemId' },
      },
    ],
  });

const ownerWithField = ({
  key,
  valueName,
}: {
  key: string;
  valueName: string;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.ExportNamedDeclaration,
    declaration: {
      type: TsestreeNodeType.VariableDeclaration,
      declarations: [
        {
          type: TsestreeNodeType.VariableDeclarator,
          id: { type: TsestreeNodeType.Identifier, name: 'workItemContract' },
          init: {
            type: TsestreeNodeType.CallExpression,
            arguments: [
              {
                type: TsestreeNodeType.ObjectExpression,
                properties: [
                  {
                    type: TsestreeNodeType.Property,
                    key: { type: TsestreeNodeType.Identifier, name: key },
                    value: { type: TsestreeNodeType.Identifier, name: valueName },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  });

describe('astLocalIdConstsTransformer', () => {
  describe('a local const used as an owner id', () => {
    it('VALID: {id: workItemId in workItemContract} => maps the const to its owner', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localId(), ownerWithField({ key: 'id', valueName: 'workItemId' })],
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([['workItemId', 'workItemContract']]);
    });
  });

  describe('a local const that is not an owner id', () => {
    it('EMPTY: {mintedBy: workItemId} => the key is not id, so nothing maps', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localId(), ownerWithField({ key: 'mintedBy', valueName: 'workItemId' })],
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });

    it('EMPTY: {id: importedId} => the value is not a local const, so nothing maps', () => {
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [localId(), ownerWithField({ key: 'id', valueName: 'importedId' })],
      });

      const result = astLocalIdConstsTransformer({ program });

      expect([...result]).toStrictEqual([]);
    });
  });
});
