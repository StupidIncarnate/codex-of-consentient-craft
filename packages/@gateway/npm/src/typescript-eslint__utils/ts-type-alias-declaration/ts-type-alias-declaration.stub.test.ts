import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TSTypeAliasDeclarationStub } from './ts-type-alias-declaration.stub';

describe('TSTypeAliasDeclarationStub', () => {
  it('VALID: {} => a real TSTypeAliasDeclaration parsed from the default code', () => {
    const node = TSTypeAliasDeclarationStub();

    expect({ type: node.type, text: 'type T = { a: string };'.slice(...node.range) }).toStrictEqual(
      {
        type: AST_NODE_TYPES.TSTypeAliasDeclaration,
        text: 'type T = { a: string };',
      },
    );
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TSTypeAliasDeclarationStub({ code: '  type T = { a: string };' });

    expect(node.range).toStrictEqual([
      TSTypeAliasDeclarationStub().range[0] + 2,
      TSTypeAliasDeclarationStub().range[1] + 2,
    ]);
  });
});
