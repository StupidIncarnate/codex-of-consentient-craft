import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { SpreadElementStub } from './spread-element.stub';

describe('SpreadElementStub', () => {
  it('VALID: {} => a real SpreadElement parsed from the default code', () => {
    const node = SpreadElementStub();

    expect({ type: node.type, text: 'f(...a);'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.SpreadElement,
      text: '...a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = SpreadElementStub({ code: '  f(...a);' });

    expect(node.range).toStrictEqual([
      SpreadElementStub().range[0] + 2,
      SpreadElementStub().range[1] + 2,
    ]);
  });
});
