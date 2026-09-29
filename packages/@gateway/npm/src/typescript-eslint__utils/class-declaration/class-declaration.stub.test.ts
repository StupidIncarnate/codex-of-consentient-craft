import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ClassDeclarationStub } from './class-declaration.stub';

describe('ClassDeclarationStub', () => {
  it('VALID: {} => a real ClassDeclaration parsed from the default code', () => {
    const node = ClassDeclarationStub();

    expect({ type: node.type, text: 'class A {}'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ClassDeclaration,
      text: 'class A {}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ClassDeclarationStub({ code: '  class A {}' });

    expect(node.range).toStrictEqual([
      ClassDeclarationStub().range[0] + 2,
      ClassDeclarationStub().range[1] + 2,
    ]);
  });
});
