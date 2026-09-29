import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { IfStatementStub } from './if-statement.stub';

describe('IfStatementStub', () => {
  it('VALID: {} => a real IfStatement parsed from the default code', () => {
    const node = IfStatementStub();

    expect({ type: node.type, text: 'if (a) {}'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.IfStatement,
      text: 'if (a) {}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = IfStatementStub({ code: '  if (a) {}' });

    expect(node.range).toStrictEqual([
      IfStatementStub().range[0] + 2,
      IfStatementStub().range[1] + 2,
    ]);
  });
});
