import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSConstructSignatureDeclarationStub } from './ts-construct-signature-declaration.stub';

describe('TSConstructSignatureDeclarationStub', () => {
  it('VALID: {} => a real TSConstructSignatureDeclaration parsed from the default code', () => {
    const node = TSConstructSignatureDeclarationStub();

    expect({ type: node.type, text: 'type T = { new (): T };'.slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.TSConstructSignatureDeclaration,
        text: 'new (): T',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSConstructSignatureDeclarationStub({ code: '  type T = { new (): T };' });

    expect(node.range).toStrictEqual([
      TSConstructSignatureDeclarationStub().range[0] + 2,
      TSConstructSignatureDeclarationStub().range[1] + 2,
    ]);
  });
});
