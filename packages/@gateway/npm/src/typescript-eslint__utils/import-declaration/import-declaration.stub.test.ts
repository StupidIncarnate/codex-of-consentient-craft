import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ImportDeclarationStub } from './import-declaration.stub';

describe('ImportDeclarationStub', () => {
  it('VALID: {} => a real ImportDeclaration parsed from the default code', () => {
    const node = ImportDeclarationStub();

    expect({ type: node.type, text: "import { a } from 'x';".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ImportDeclaration,
      text: "import { a } from 'x';",
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ImportDeclarationStub({ code: "  import { a } from 'x';" });

    expect(node.range).toStrictEqual([
      ImportDeclarationStub().range[0] + 2,
      ImportDeclarationStub().range[1] + 2,
    ]);
  });
});
