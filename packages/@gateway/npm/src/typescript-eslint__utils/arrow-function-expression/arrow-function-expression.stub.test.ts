import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ArrowFunctionExpressionStub } from './arrow-function-expression.stub';

describe('ArrowFunctionExpressionStub', () => {
  it('VALID: {} => a real ArrowFunctionExpression with an empty param list and a block body', () => {
    const node = ArrowFunctionExpressionStub();

    expect({
      type: node.type,
      paramCount: node.params.length,
      bodyType: node.body.type,
    }).toStrictEqual({
      type: AST_NODE_TYPES.ArrowFunctionExpression,
      paramCount: 0,
      bodyType: AST_NODE_TYPES.BlockStatement,
    });
  });

  it('VALID: {code: with a param} => real params populated, unlike a hand-built node', () => {
    const node = ArrowFunctionExpressionStub({ code: 'const fn = (x) => x;' });

    expect({ paramCount: node.params.length, bodyType: node.body.type }).toStrictEqual({
      paramCount: 1,
      bodyType: AST_NODE_TYPES.Identifier,
    });
  });
});
