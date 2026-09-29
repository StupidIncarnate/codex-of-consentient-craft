import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ArrayExpressionStub } from './array-expression.stub';

describe('ArrayExpressionStub', () => {
  it('VALID: {} => a real ArrayExpression parsed from the default code', () => {
    const node = ArrayExpressionStub();

    expect({ type: node.type, text: 'const a = [1];'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ArrayExpression,
      text: '[1]',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ArrayExpressionStub({ code: '  const a = [1];' });

    expect(node.range).toStrictEqual([
      ArrayExpressionStub().range[0] + 2,
      ArrayExpressionStub().range[1] + 2,
    ]);
  });
});
