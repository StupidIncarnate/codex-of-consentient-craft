import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeOperatorStub } from './ts-type-operator.stub';

describe('TSTypeOperatorStub', () => {
  it('VALID: {} => a real TSTypeOperator parsed from the default code', () => {
    const node = TSTypeOperatorStub();

    expect({
      type: node.type,
      text: 'let x: readonly string[];'.slice(...node.range),
    }).toStrictEqual({
      type: AST_NODE_TYPES.TSTypeOperator,
      text: 'readonly string[]',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeOperatorStub({ code: '  let x: readonly string[];' });

    expect(node.range).toStrictEqual([
      TSTypeOperatorStub().range[0] + 2,
      TSTypeOperatorStub().range[1] + 2,
    ]);
  });
});
