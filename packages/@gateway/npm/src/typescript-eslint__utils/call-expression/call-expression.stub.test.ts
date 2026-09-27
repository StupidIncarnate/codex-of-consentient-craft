import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { CallExpressionStub } from './call-expression.stub';

describe('CallExpressionStub', () => {
  it('VALID: {} => a real CallExpression with one argument, unlike a hand-built node', () => {
    const node = CallExpressionStub();

    expect({ argumentCount: node.arguments.length, calleeType: node.callee.type }).toStrictEqual({
      argumentCount: 1,
      calleeType: AST_NODE_TYPES.Identifier,
    });
  });

  it('VALID: {code: "bar(1, 2);"} => real arguments reflect the given code', () => {
    const node = CallExpressionStub({ code: 'bar(1, 2);' });

    expect({
      argumentCount: node.arguments.length,
      firstArgumentType: node.arguments[0]?.type,
    }).toStrictEqual({ argumentCount: 2, firstArgumentType: AST_NODE_TYPES.Literal });
  });
});
