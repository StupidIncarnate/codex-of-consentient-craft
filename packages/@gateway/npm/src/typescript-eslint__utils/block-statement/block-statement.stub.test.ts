import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { BlockStatementStub } from './block-statement.stub';

describe('BlockStatementStub', () => {
  it('VALID: {} => a real, empty BlockStatement belonging to a FunctionDeclaration', () => {
    const node = BlockStatementStub();

    expect({ bodyLength: node.body.length, parentType: node.parent.type }).toStrictEqual({
      bodyLength: 0,
      parentType: AST_NODE_TYPES.FunctionDeclaration,
    });
  });

  it('VALID: {code: a body statement} => real body reflects the given code', () => {
    const node = BlockStatementStub({ code: 'function foo() { const a = 1; }' });

    expect({ bodyLength: node.body.length }).toStrictEqual({ bodyLength: 1 });
  });
});
