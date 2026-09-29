import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { MethodDefinitionStub } from './method-definition.stub';

describe('MethodDefinitionStub', () => {
  it('VALID: {} => a real MethodDefinition parsed from the default code', () => {
    const node = MethodDefinitionStub();

    expect({ type: node.type, text: 'class A { m() {} }'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.MethodDefinition,
      text: 'm() {}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = MethodDefinitionStub({ code: '  class A { m() {} }' });

    expect(node.range).toStrictEqual([
      MethodDefinitionStub().range[0] + 2,
      MethodDefinitionStub().range[1] + 2,
    ]);
  });
});
