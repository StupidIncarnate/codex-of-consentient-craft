/**
 * PURPOSE: Says whether an interface is a phantom carrier: it extends nothing and every member is a
 * property keyed by a computed `unique symbol` const declared in the same file (`readonly [ING]:
 * unknown`). Such a type exists only at compile time, so Zod has no schema for it.
 *
 * USAGE:
 * phantomInterfaceDetectLayerTransformer({ declaration, uniqueSymbolNames: [IdentifierStub()] });
 * // Returns true for `interface Carrier { readonly [ING]: unknown }` when ING is a unique symbol
 */
import * as ts from '#gateway/npm/typescript';

export const phantomInterfaceDetectLayerTransformer = ({
  declaration,
  uniqueSymbolNames,
}: {
  declaration: ts.InterfaceDeclaration;
  uniqueSymbolNames: readonly string[];
}): boolean =>
  declaration.heritageClauses === undefined &&
  declaration.members.length > 0 &&
  declaration.members.every(
    (member) =>
      ts.isPropertySignature(member) &&
      member.name.kind === ts.SyntaxKind.ComputedPropertyName &&
      uniqueSymbolNames.some(
        (symbolName) => member.name.getText().replace(/[\s[\]]/gu, '') === symbolName,
      ),
  );
