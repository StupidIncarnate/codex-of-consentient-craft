import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSUnionTypeStub } from './ts-union-type.stub';

describe('TSUnionTypeStub', () => {
  it('VALID: {} => a real TSUnionType parsed from the default code', () => {
    const node = TSUnionTypeStub();

    expect({ type: node.type, text: 'let x: A | B;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSUnionType,
      text: 'A | B',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSUnionTypeStub({ code: '  let x: A | B;' });

    expect(node.range).toStrictEqual([
      TSUnionTypeStub().range[0] + 2,
      TSUnionTypeStub().range[1] + 2,
    ]);
  });
});
