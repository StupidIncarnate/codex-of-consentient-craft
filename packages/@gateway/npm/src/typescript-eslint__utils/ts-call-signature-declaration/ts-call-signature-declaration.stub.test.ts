import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSCallSignatureDeclarationStub } from './ts-call-signature-declaration.stub';

describe('TSCallSignatureDeclarationStub', () => {
  it('VALID: {} => a real TSCallSignatureDeclaration parsed from the default code', () => {
    const node = TSCallSignatureDeclarationStub();

    expect({ type: node.type, text: 'type T = { (): void };'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TSCallSignatureDeclaration,
      text: '(): void',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSCallSignatureDeclarationStub({ code: '  type T = { (): void };' });

    expect(node.range).toStrictEqual([
      TSCallSignatureDeclarationStub().range[0] + 2,
      TSCallSignatureDeclarationStub().range[1] + 2,
    ]);
  });
});
