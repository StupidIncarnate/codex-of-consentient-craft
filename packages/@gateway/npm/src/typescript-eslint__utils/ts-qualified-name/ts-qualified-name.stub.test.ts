import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSQualifiedNameStub } from './ts-qualified-name.stub';

describe('TSQualifiedNameStub', () => {
  it('VALID: {} => a real TSQualifiedName parsed from the default code', () => {
    const node = TSQualifiedNameStub();

    expect({ type: node.type, text: 'let x: A.B;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSQualifiedName,
      text: 'A.B',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSQualifiedNameStub({ code: '  let x: A.B;' });

    expect(node.range).toStrictEqual([
      TSQualifiedNameStub().range[0] + 2,
      TSQualifiedNameStub().range[1] + 2,
    ]);
  });
});
