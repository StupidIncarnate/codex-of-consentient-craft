import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ImportExpressionStub } from './import-expression.stub';

describe('ImportExpressionStub', () => {
  it('VALID: {} => a real ImportExpression parsed from the default code', () => {
    const node = ImportExpressionStub();

    expect({ type: node.type, text: "import('x');".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ImportExpression,
      text: "import('x')",
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ImportExpressionStub({ code: "  import('x');" });

    expect(node.range).toStrictEqual([
      ImportExpressionStub().range[0] + 2,
      ImportExpressionStub().range[1] + 2,
    ]);
  });
});
