import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ConditionalExpressionStub } from './conditional-expression.stub';

describe('ConditionalExpressionStub', () => {
  it('VALID: {} => a real ConditionalExpression parsed from the default code', () => {
    const node = ConditionalExpressionStub();

    expect({ type: node.type, text: 'a ? b : c;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ConditionalExpression,
      text: 'a ? b : c',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ConditionalExpressionStub({ code: '  a ? b : c;' });

    expect(node.range).toStrictEqual([
      ConditionalExpressionStub().range[0] + 2,
      ConditionalExpressionStub().range[1] + 2,
    ]);
  });
});
