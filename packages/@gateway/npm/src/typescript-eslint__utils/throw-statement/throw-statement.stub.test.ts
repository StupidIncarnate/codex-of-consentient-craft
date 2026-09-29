import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ThrowStatementStub } from './throw-statement.stub';

describe('ThrowStatementStub', () => {
  it('VALID: {} => a real ThrowStatement parsed from the default code', () => {
    const node = ThrowStatementStub();

    expect({ type: node.type, text: 'throw a;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ThrowStatement,
      text: 'throw a;',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ThrowStatementStub({ code: '  throw a;' });

    expect(node.range).toStrictEqual([
      ThrowStatementStub().range[0] + 2,
      ThrowStatementStub().range[1] + 2,
    ]);
  });
});
