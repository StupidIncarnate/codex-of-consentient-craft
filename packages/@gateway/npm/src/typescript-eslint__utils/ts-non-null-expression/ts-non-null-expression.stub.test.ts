import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSNonNullExpressionStub } from './ts-non-null-expression.stub';

describe('TSNonNullExpressionStub', () => {
  it('VALID: {} => a real TSNonNullExpression parsed from the default code', () => {
    const node = TSNonNullExpressionStub();

    expect({ type: node.type, text: 'a!;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSNonNullExpression,
      text: 'a!',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSNonNullExpressionStub({ code: '  a!;' });

    expect(node.range).toStrictEqual([
      TSNonNullExpressionStub().range[0] + 2,
      TSNonNullExpressionStub().range[1] + 2,
    ]);
  });
});
