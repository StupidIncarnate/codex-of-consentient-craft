import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { UnaryExpressionStub } from './unary-expression.stub';

describe('UnaryExpressionStub', () => {
  it('VALID: {} => a real UnaryExpression parsed from the default code', () => {
    const node = UnaryExpressionStub();

    expect({ type: node.type, text: '!a;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.UnaryExpression,
      text: '!a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = UnaryExpressionStub({ code: '  !a;' });

    expect(node.range).toStrictEqual([
      UnaryExpressionStub().range[0] + 2,
      UnaryExpressionStub().range[1] + 2,
    ]);
  });
});
