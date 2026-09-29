import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { LogicalExpressionStub } from './logical-expression.stub';

describe('LogicalExpressionStub', () => {
  it('VALID: {} => a real LogicalExpression parsed from the default code', () => {
    const node = LogicalExpressionStub();

    expect({ type: node.type, text: 'a && b;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.LogicalExpression,
      text: 'a && b',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = LogicalExpressionStub({ code: '  a && b;' });

    expect(node.range).toStrictEqual([
      LogicalExpressionStub().range[0] + 2,
      LogicalExpressionStub().range[1] + 2,
    ]);
  });
});
