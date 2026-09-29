import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ImportSpecifierStub } from './import-specifier.stub';

describe('ImportSpecifierStub', () => {
  it('VALID: {} => a real ImportSpecifier parsed from the default code', () => {
    const node = ImportSpecifierStub();

    expect({ type: node.type, text: "import { a } from 'x';".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ImportSpecifier,
      text: 'a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ImportSpecifierStub({ code: "  import { a } from 'x';" });

    expect(node.range).toStrictEqual([
      ImportSpecifierStub().range[0] + 2,
      ImportSpecifierStub().range[1] + 2,
    ]);
  });
});
