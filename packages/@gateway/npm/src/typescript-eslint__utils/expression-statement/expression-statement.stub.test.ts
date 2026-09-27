import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ExpressionStatementStub } from './expression-statement.stub';

describe('ExpressionStatementStub', () => {
  it('VALID: {} => a real ExpressionStatement wrapping a CallExpression, at Program level', () => {
    const node = ExpressionStatementStub();

    expect({ expressionType: node.expression.type, parentType: node.parent.type }).toStrictEqual({
      expressionType: AST_NODE_TYPES.CallExpression,
      parentType: AST_NODE_TYPES.Program,
    });
  });

  it('VALID: {code: an assignment} => real expression reflects the given code', () => {
    const node = ExpressionStatementStub({ code: 'a = 1;' });

    expect(node.expression.type).toBe(AST_NODE_TYPES.AssignmentExpression);
  });
});
