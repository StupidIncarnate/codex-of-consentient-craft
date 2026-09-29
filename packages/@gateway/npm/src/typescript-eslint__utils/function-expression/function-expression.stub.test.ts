import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { FunctionExpressionStub } from './function-expression.stub';

describe('FunctionExpressionStub', () => {
  it('VALID: {} => a real FunctionExpression parsed from the default code', () => {
    const node = FunctionExpressionStub();

    expect({
      type: node.type,
      text: 'const f = function () {};'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.FunctionExpression,
      text: 'function () {}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = FunctionExpressionStub({ code: '  const f = function () {};' });

    expect(node.range).toStrictEqual([
      FunctionExpressionStub().range[0] + 2,
      FunctionExpressionStub().range[1] + 2,
    ]);
  });
});
