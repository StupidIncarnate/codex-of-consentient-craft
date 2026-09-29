import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { VariableDeclaratorStub } from './variable-declarator.stub';

describe('VariableDeclaratorStub', () => {
  it('VALID: {} => a real VariableDeclarator parsed from the default code', () => {
    const node = VariableDeclaratorStub();

    expect({ type: node.type, text: 'const a = 1;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.VariableDeclarator,
      text: 'a = 1',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = VariableDeclaratorStub({ code: '  const a = 1;' });

    expect(node.range).toStrictEqual([
      VariableDeclaratorStub().range[0] + 2,
      VariableDeclaratorStub().range[1] + 2,
    ]);
  });
});
