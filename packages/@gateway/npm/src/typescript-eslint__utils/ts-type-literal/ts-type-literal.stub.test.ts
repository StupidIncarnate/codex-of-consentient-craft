import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeLiteralStub } from './ts-type-literal.stub';

describe('TSTypeLiteralStub', () => {
  it('VALID: {} => a real TSTypeLiteral parsed from the default code', () => {
    const node = TSTypeLiteralStub();

    expect({ type: node.type, text: 'type T = { a: string };'.slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.TSTypeLiteral,
        text: '{ a: string }',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeLiteralStub({ code: '  type T = { a: string };' });

    expect(node.range).toStrictEqual([
      TSTypeLiteralStub().range[0] + 2,
      TSTypeLiteralStub().range[1] + 2,
    ]);
  });
});
