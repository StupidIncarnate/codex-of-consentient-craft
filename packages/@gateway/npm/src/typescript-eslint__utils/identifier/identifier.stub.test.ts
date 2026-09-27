import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { IdentifierStub } from './identifier.stub';

describe('IdentifierStub', () => {
  it('VALID: {} => a real Identifier named "foo", parented in an ExpressionStatement', () => {
    const node = IdentifierStub();

    expect({ type: node.type, name: node.name, parentType: node.parent.type }).toStrictEqual({
      type: AST_NODE_TYPES.Identifier,
      name: 'foo',
      parentType: AST_NODE_TYPES.ExpressionStatement,
    });
  });

  it('VALID: {code: "bar;"} => a real Identifier named "bar"', () => {
    const node = IdentifierStub({ code: 'bar;' });

    expect(node.name).toBe('bar');
  });
});
