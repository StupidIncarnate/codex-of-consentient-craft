import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSAsExpressionStub } from './ts-as-expression.stub';

describe('TSAsExpressionStub', () => {
  it('VALID: {} => a real TSAsExpression parsed from the default code', () => {
    const node = TSAsExpressionStub();

    expect({ type: node.type, text: 'a as b;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSAsExpression,
      text: 'a as b',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSAsExpressionStub({ code: '  a as b;' });

    expect(node.range).toStrictEqual([
      TSAsExpressionStub().range[0] + 2,
      TSAsExpressionStub().range[1] + 2,
    ]);
  });
});
