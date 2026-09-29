import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ImportNamespaceSpecifierStub } from './import-namespace-specifier.stub';

describe('ImportNamespaceSpecifierStub', () => {
  it('VALID: {} => a real ImportNamespaceSpecifier parsed from the default code', () => {
    const node = ImportNamespaceSpecifierStub();

    expect({ type: node.type, text: "import * as a from 'x';".slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.ImportNamespaceSpecifier,
        text: '* as a',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ImportNamespaceSpecifierStub({ code: "  import * as a from 'x';" });

    expect(node.range).toStrictEqual([
      ImportNamespaceSpecifierStub().range[0] + 2,
      ImportNamespaceSpecifierStub().range[1] + 2,
    ]);
  });
});
