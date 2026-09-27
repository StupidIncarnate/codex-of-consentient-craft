import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { PropertyStub } from './property.stub';

describe('PropertyStub', () => {
  it('VALID: {} => a real Property, key "a" and value Literal 1, inside an ObjectExpression', () => {
    const node = PropertyStub();

    expect({
      keyType: node.key.type,
      valueType: node.value.type,
      parentType: node.parent.type,
    }).toStrictEqual({
      keyType: AST_NODE_TYPES.Identifier,
      valueType: AST_NODE_TYPES.Literal,
      parentType: AST_NODE_TYPES.ObjectExpression,
    });
  });

  it('VALID: {code: a shorthand property} => real shorthand reflects the given code', () => {
    const node = PropertyStub({ code: 'const a = 1; const obj = { a };' });

    expect(node.shorthand).toBe(true);
  });
});
