import * as ts from '#gateway/npm/typescript';

import { IdentifierStub } from '../../contracts/identifier/identifier.stub';
import { typeMemberKindsLayerTransformer } from './type-member-kinds-layer-transformer';

const kindsOf = ({ text }: { text: string }): string[][] => {
  const sourceFile = ts.createSourceFile('/repo/a-contract.ts', text, ts.ScriptTarget.Latest, true);
  const declarations = sourceFile.statements.filter(ts.isTypeAliasDeclaration);
  const typeAliases = declarations.map((declaration) => ({
    name: IdentifierStub({ value: declaration.name.text }),
    node: declaration.type,
  }));
  return declarations
    .filter((declaration) => declaration.name.text === 'Thing')
    .flatMap((declaration) =>
      ts.isTypeLiteralNode(declaration.type)
        ? [
            typeMemberKindsLayerTransformer({
              members: declaration.type.members,
              typeAliases,
              visitedNames: [IdentifierStub({ value: 'Thing' })],
            }),
          ]
        : [],
    );
};

describe('typeMemberKindsLayerTransformer', () => {
  describe('valid input', () => {
    it('VALID: {method, function property, same-file function alias, length, data} => returns each kind in order', () => {
      const result = kindsOf({
        text: 'type Send = () => void; type Thing = { a(): void; b: () => void; c: Send; length: number; d: string }',
      });

      expect(result).toStrictEqual([['function', 'function', 'function', 'length', 'data']]);
    });

    it('VALID: {same-file alias of plain data, alias of a string} => returns data', () => {
      const result = kindsOf({
        text: 'type Plain = { id: string }; type Id = string; type Thing = { a: Plain; b: Id }',
      });

      expect(result).toStrictEqual([['data', 'data']]);
    });
  });
});
