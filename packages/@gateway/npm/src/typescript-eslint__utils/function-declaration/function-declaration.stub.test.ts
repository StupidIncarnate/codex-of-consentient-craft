import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { FunctionDeclarationStub } from './function-declaration.stub';

describe('FunctionDeclarationStub', () => {
  it('VALID: {} => a real FunctionDeclaration parsed from the default code', () => {
    const node = FunctionDeclarationStub();

    expect({ type: node.type, text: 'function f() {}'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.FunctionDeclaration,
      text: 'function f() {}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = FunctionDeclarationStub({ code: '  function f() {}' });

    expect(node.range).toStrictEqual([
      FunctionDeclarationStub().range[0] + 2,
      FunctionDeclarationStub().range[1] + 2,
    ]);
  });
});
