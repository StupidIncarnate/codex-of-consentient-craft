import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { BinaryExpressionStub } from './binary-expression.stub';

describe('BinaryExpressionStub', () => {
  it('VALID: {} => a real BinaryExpression parsed from the default code', () => {
    const node = BinaryExpressionStub();

    expect({ type: node.type, text: 'a + b;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.BinaryExpression,
      text: 'a + b',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = BinaryExpressionStub({ code: '  a + b;' });

    expect(node.range).toStrictEqual([
      BinaryExpressionStub().range[0] + 2,
      BinaryExpressionStub().range[1] + 2,
    ]);
  });
});
