import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ReturnStatementStub } from './return-statement.stub';

describe('ReturnStatementStub', () => {
  it('VALID: {} => a real ReturnStatement returning a Literal, inside a BlockStatement', () => {
    const node = ReturnStatementStub();

    expect({ argumentType: node.argument?.type, parentType: node.parent.type }).toStrictEqual({
      argumentType: AST_NODE_TYPES.Literal,
      parentType: AST_NODE_TYPES.BlockStatement,
    });
  });

  it('EMPTY: {code: bare "return;"} => a real ReturnStatement with no argument', () => {
    const node = ReturnStatementStub({ code: 'function foo() { return; }' });

    expect(node.argument).toBe(null);
  });
});
