import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ExportNamedDeclarationStub } from './export-named-declaration.stub';

describe('ExportNamedDeclarationStub', () => {
  it('VALID: {} => a real ExportNamedDeclaration parsed from the default code', () => {
    const node = ExportNamedDeclarationStub();

    expect({ type: node.type, text: 'export const a = 1;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ExportNamedDeclaration,
      text: 'export const a = 1;',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ExportNamedDeclarationStub({ code: '  export const a = 1;' });

    expect(node.range).toStrictEqual([
      ExportNamedDeclarationStub().range[0] + 2,
      ExportNamedDeclarationStub().range[1] + 2,
    ]);
  });
});
