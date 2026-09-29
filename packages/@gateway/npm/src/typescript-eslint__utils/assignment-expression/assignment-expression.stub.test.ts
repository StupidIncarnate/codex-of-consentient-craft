import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { AssignmentExpressionStub } from './assignment-expression.stub';

describe('AssignmentExpressionStub', () => {
  it('VALID: {} => a real AssignmentExpression parsed from the default code', () => {
    const node = AssignmentExpressionStub();

    expect({ type: node.type, text: 'a = 1;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.AssignmentExpression,
      text: 'a = 1',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = AssignmentExpressionStub({ code: '  a = 1;' });

    expect(node.range).toStrictEqual([
      AssignmentExpressionStub().range[0] + 2,
      AssignmentExpressionStub().range[1] + 2,
    ]);
  });
});
