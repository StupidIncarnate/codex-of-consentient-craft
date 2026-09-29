import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ExportAllDeclarationStub } from './export-all-declaration.stub';

describe('ExportAllDeclarationStub', () => {
  it('VALID: {} => a real ExportAllDeclaration parsed from the default code', () => {
    const node = ExportAllDeclarationStub();

    expect({ type: node.type, text: "export * from 'x';".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ExportAllDeclaration,
      text: "export * from 'x';",
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ExportAllDeclarationStub({ code: "  export * from 'x';" });

    expect(node.range).toStrictEqual([
      ExportAllDeclarationStub().range[0] + 2,
      ExportAllDeclarationStub().range[1] + 2,
    ]);
  });
});
