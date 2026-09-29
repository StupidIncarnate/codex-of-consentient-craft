import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { UpdateExpressionStub } from './update-expression.stub';

describe('UpdateExpressionStub', () => {
  it('VALID: {} => a real UpdateExpression parsed from the default code', () => {
    const node = UpdateExpressionStub();

    expect({ type: node.type, text: 'a++;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.UpdateExpression,
      text: 'a++',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = UpdateExpressionStub({ code: '  a++;' });

    expect(node.range).toStrictEqual([
      UpdateExpressionStub().range[0] + 2,
      UpdateExpressionStub().range[1] + 2,
    ]);
  });
});
