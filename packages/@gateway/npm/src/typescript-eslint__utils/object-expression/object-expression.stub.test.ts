import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ObjectExpressionStub } from './object-expression.stub';

describe('ObjectExpressionStub', () => {
  it('VALID: {} => a real ObjectExpression with one Property', () => {
    const node = ObjectExpressionStub();

    expect({
      propertyCount: node.properties.length,
      firstPropertyType: node.properties[0]?.type,
    }).toStrictEqual({ propertyCount: 1, firstPropertyType: AST_NODE_TYPES.Property });
  });

  it('VALID: {code: two properties} => real properties reflect the given code', () => {
    const node = ObjectExpressionStub({ code: 'const obj = { a: 1, b: 2 };' });

    expect({ propertyCount: node.properties.length }).toStrictEqual({ propertyCount: 2 });
  });
});
