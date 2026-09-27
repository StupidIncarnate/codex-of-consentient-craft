import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { MemberExpressionStub } from './member-expression.stub';

describe('MemberExpressionStub', () => {
  it('VALID: {} => a real, non-computed MemberExpression, foo.bar', () => {
    const node = MemberExpressionStub();

    expect({
      objectType: node.object.type,
      propertyType: node.property.type,
      computed: node.computed,
    }).toStrictEqual({
      objectType: AST_NODE_TYPES.Identifier,
      propertyType: AST_NODE_TYPES.Identifier,
      computed: false,
    });
  });

  it('VALID: {code: "foo[bar];"} => computed access reflects the given code', () => {
    const node = MemberExpressionStub({ code: 'foo[bar];' });

    expect(node.computed).toBe(true);
  });
});
