import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { AstStub } from './ast.stub';

describe('AstStub', () => {
  it('VALID: {} => a real Program with one real VariableDeclaration statement', () => {
    const ast = AstStub();

    expect(ast.body[0]?.type).toBe(AST_NODE_TYPES.VariableDeclaration);
  });
});
