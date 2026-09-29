import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSArrayTypeStub } from './ts-array-type.stub';

describe('TSArrayTypeStub', () => {
  it('VALID: {} => a real TSArrayType parsed from the default code', () => {
    const node = TSArrayTypeStub();

    expect({ type: node.type, text: 'let x: string[];'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSArrayType,
      text: 'string[]',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSArrayTypeStub({ code: '  let x: string[];' });

    expect(node.range).toStrictEqual([
      TSArrayTypeStub().range[0] + 2,
      TSArrayTypeStub().range[1] + 2,
    ]);
  });
});
