/**
 * PURPOSE: Says whether a type reference is `Pick<SomeArray[], 'length'>`, the array-length half of
 * an array-like method set.
 *
 * USAGE:
 * lengthPickDetectLayerTransformer({ node: typeReferenceNode });
 * // Returns true for `Pick<unknown[][], "length">`
 */
import * as ts from '#gateway/npm/typescript';

export const lengthPickDetectLayerTransformer = ({ node }: { node: ts.Node }): boolean => {
  if (!ts.isTypeReferenceNode(node)) {
    return false;
  }
  const [firstArgument, keyArgument] = node.typeArguments ?? [];
  return (
    ts.isIdentifier(node.typeName) &&
    node.typeName.text === 'Pick' &&
    firstArgument?.kind === ts.SyntaxKind.ArrayType &&
    keyArgument?.kind === ts.SyntaxKind.LiteralType &&
    ['"length"', "'length'"].includes(keyArgument.getText())
  );
};
