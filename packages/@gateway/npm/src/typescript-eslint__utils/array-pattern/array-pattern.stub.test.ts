import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ArrayPatternStub } from './array-pattern.stub';

describe('ArrayPatternStub', () => {
  it('VALID: {} => a real ArrayPattern parsed from the default code', () => {
    const node = ArrayPatternStub();

    expect({ type: node.type, text: 'const [a] = y;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ArrayPattern,
      text: '[a]',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ArrayPatternStub({ code: '  const [a] = y;' });

    expect(node.range).toStrictEqual([
      ArrayPatternStub().range[0] + 2,
      ArrayPatternStub().range[1] + 2,
    ]);
  });
});
