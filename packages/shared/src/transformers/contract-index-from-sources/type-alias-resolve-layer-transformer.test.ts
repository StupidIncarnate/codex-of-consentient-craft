import * as ts from '#gateway/npm/typescript';

import { typeAliasResolveLayerTransformer } from './type-alias-resolve-layer-transformer';

const resolveFrom = ({
  text,
  visited,
}: {
  text: string;
  visited: string[];
}): { name: string; kind: ts.SyntaxKind }[] => {
  const sourceFile = ts.createSourceFile('/repo/a-contract.ts', text, ts.ScriptTarget.Latest, true);
  const declarations = sourceFile.statements.filter(ts.isTypeAliasDeclaration);
  const typeAliases = declarations.map((declaration) => ({
    name: declaration.name.text,
    node: declaration.type,
  }));
  return declarations
    .filter((declaration) => declaration.name.text === 'Thing')
    .flatMap((declaration) => {
      const found = typeAliasResolveLayerTransformer({
        typeNode: declaration.type,
        typeAliases,
        visitedNames: visited.map((value) => value),
      });
      return found === undefined ? [] : [{ name: String(found.name), kind: found.node.kind }];
    });
};

describe('typeAliasResolveLayerTransformer', () => {
  describe('valid input', () => {
    it('VALID: {bare reference to a same-file alias} => returns the alias and its right-hand side', () => {
      const result = resolveFrom({
        text: 'type Send = () => void; type Thing = Send',
        visited: [],
      });

      expect(result).toStrictEqual([{ name: 'Send', kind: ts.SyntaxKind.FunctionType }]);
    });
  });

  describe('unresolved input', () => {
    it('EMPTY: {reference to a name not declared in the file} => returns undefined', () => {
      const result = resolveFrom({ text: 'type Thing = Missing', visited: [] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {reference to a name already being read} => returns undefined', () => {
      const result = resolveFrom({
        text: 'type Send = () => void; type Thing = Send',
        visited: ['Send'],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {reference with type arguments} => returns undefined', () => {
      const result = resolveFrom({
        text: 'type Send = () => void; type Thing = Send<string>',
        visited: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {qualified reference} => returns undefined', () => {
      const result = resolveFrom({
        text: 'type Send = () => void; type Thing = ns.Send',
        visited: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
