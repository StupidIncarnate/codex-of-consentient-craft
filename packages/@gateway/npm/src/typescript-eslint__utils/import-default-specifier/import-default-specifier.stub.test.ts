import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ImportDefaultSpecifierStub } from './import-default-specifier.stub';

describe('ImportDefaultSpecifierStub', () => {
  it('VALID: {} => a real ImportDefaultSpecifier parsed from the default code', () => {
    const node = ImportDefaultSpecifierStub();

    expect({ type: node.type, text: "import a from 'x';".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ImportDefaultSpecifier,
      text: 'a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ImportDefaultSpecifierStub({ code: "  import a from 'x';" });

    expect(node.range).toStrictEqual([
      ImportDefaultSpecifierStub().range[0] + 2,
      ImportDefaultSpecifierStub().range[1] + 2,
    ]);
  });
});
