import { astProgramDeclaratorsTransformer } from './ast-program-declarators-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const program = TsestreeStub({
  type: TsestreeNodeType.Program,
  body: [
    {
      type: TsestreeNodeType.VariableDeclaration,
      declarations: [
        {
          type: TsestreeNodeType.VariableDeclarator,
          id: { type: TsestreeNodeType.Identifier, name: 'localFields' },
        },
      ],
    },
    {
      type: TsestreeNodeType.ExportNamedDeclaration,
      declaration: {
        type: TsestreeNodeType.VariableDeclaration,
        declarations: [
          {
            type: TsestreeNodeType.VariableDeclarator,
            id: { type: TsestreeNodeType.Identifier, name: 'questContract' },
          },
        ],
      },
    },
    {
      type: TsestreeNodeType.ImportDeclaration,
    },
  ],
});

describe('astProgramDeclaratorsTransformer', () => {
  describe('every top-level declarator', () => {
    it('VALID: {localOnly: false} => returns the local and the exported declarator', () => {
      const result = astProgramDeclaratorsTransformer({ program, localOnly: false });

      expect(result).toStrictEqual([
        { type: 'VariableDeclarator', id: { type: 'Identifier', name: 'localFields' } },
        { type: 'VariableDeclarator', id: { type: 'Identifier', name: 'questContract' } },
      ]);
    });
  });

  describe('only the local declarators', () => {
    it('VALID: {localOnly: true} => returns the unexported declarator alone', () => {
      const result = astProgramDeclaratorsTransformer({ program, localOnly: true });

      expect(result).toStrictEqual([
        { type: 'VariableDeclarator', id: { type: 'Identifier', name: 'localFields' } },
      ]);
    });
  });

  describe('a program with no statement list', () => {
    it('EMPTY: {body: null} => returns an empty list', () => {
      const empty = TsestreeStub({ type: TsestreeNodeType.Program, body: null });

      const result = astProgramDeclaratorsTransformer({ program: empty, localOnly: false });

      expect(result).toStrictEqual([]);
    });
  });
});
