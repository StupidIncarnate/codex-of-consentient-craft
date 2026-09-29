import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { AssignmentPatternStub } from './assignment-pattern.stub';

describe('AssignmentPatternStub', () => {
  it('VALID: {} => a real AssignmentPattern parsed from the default code', () => {
    const node = AssignmentPatternStub();

    expect({ type: node.type, text: 'const { a = 1 } = y;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.AssignmentPattern,
      text: 'a = 1',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = AssignmentPatternStub({ code: '  const { a = 1 } = y;' });

    expect(node.range).toStrictEqual([
      AssignmentPatternStub().range[0] + 2,
      AssignmentPatternStub().range[1] + 2,
    ]);
  });
});
