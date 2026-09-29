import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { AwaitExpressionStub } from './await-expression.stub';

describe('AwaitExpressionStub', () => {
  it('VALID: {} => a real AwaitExpression parsed from the default code', () => {
    const node = AwaitExpressionStub();

    expect({
      type: node.type,
      text: 'async function f() { await a; }'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.AwaitExpression,
      text: 'await a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = AwaitExpressionStub({ code: '  async function f() { await a; }' });

    expect(node.range).toStrictEqual([
      AwaitExpressionStub().range[0] + 2,
      AwaitExpressionStub().range[1] + 2,
    ]);
  });
});
