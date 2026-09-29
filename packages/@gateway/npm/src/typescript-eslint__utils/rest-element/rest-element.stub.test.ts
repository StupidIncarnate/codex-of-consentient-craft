import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { RestElementStub } from './rest-element.stub';

describe('RestElementStub', () => {
  it('VALID: {} => a real RestElement parsed from the default code', () => {
    const node = RestElementStub();

    expect({ type: node.type, text: 'const [...a] = y;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.RestElement,
      text: '...a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = RestElementStub({ code: '  const [...a] = y;' });

    expect(node.range).toStrictEqual([
      RestElementStub().range[0] + 2,
      RestElementStub().range[1] + 2,
    ]);
  });
});
