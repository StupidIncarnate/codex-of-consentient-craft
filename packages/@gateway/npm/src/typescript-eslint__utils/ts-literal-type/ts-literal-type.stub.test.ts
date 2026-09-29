import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSLiteralTypeStub } from './ts-literal-type.stub';

describe('TSLiteralTypeStub', () => {
  it('VALID: {} => a real TSLiteralType parsed from the default code', () => {
    const node = TSLiteralTypeStub();

    expect({ type: node.type, text: "let x: 'a';".slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSLiteralType,
      text: "'a'",
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSLiteralTypeStub({ code: "  let x: 'a';" });

    expect(node.range).toStrictEqual([
      TSLiteralTypeStub().range[0] + 2,
      TSLiteralTypeStub().range[1] + 2,
    ]);
  });
});
