import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { NewExpressionStub } from './new-expression.stub';

describe('NewExpressionStub', () => {
  it('VALID: {} => a real NewExpression parsed from the default code', () => {
    const node = NewExpressionStub();

    expect({ type: node.type, text: 'new A();'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.NewExpression,
      text: 'new A()',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = NewExpressionStub({ code: '  new A();' });

    expect(node.range).toStrictEqual([
      NewExpressionStub().range[0] + 2,
      NewExpressionStub().range[1] + 2,
    ]);
  });
});
