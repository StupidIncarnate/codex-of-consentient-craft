import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ObjectPatternStub } from './object-pattern.stub';

describe('ObjectPatternStub', () => {
  it('VALID: {} => a real ObjectPattern parsed from the default code', () => {
    const node = ObjectPatternStub();

    expect({ type: node.type, text: 'const { a } = y;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ObjectPattern,
      text: '{ a }',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ObjectPatternStub({ code: '  const { a } = y;' });

    expect(node.range).toStrictEqual([
      ObjectPatternStub().range[0] + 2,
      ObjectPatternStub().range[1] + 2,
    ]);
  });
});
