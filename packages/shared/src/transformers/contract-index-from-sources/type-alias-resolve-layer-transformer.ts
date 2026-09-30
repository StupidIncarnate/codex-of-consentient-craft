/**
 * PURPOSE: Finds the same-file type alias or interface a bare type reference names, unless that name
 * is already being read (a cycle) or the reference carries type arguments. Reach for this to read
 * through `type ThingData = z.infer<typeof thingContract>` when a shape depends on `ThingData`.
 *
 * USAGE:
 * typeAliasResolveLayerTransformer({ typeNode, typeAliases, visitedNames: [] });
 * // Returns { name, node } for the declaration, or undefined
 */
import * as ts from '#gateway/npm/typescript';

export const typeAliasResolveLayerTransformer = ({
  typeNode,
  typeAliases,
  visitedNames,
}: {
  typeNode: ts.Node;
  typeAliases: readonly { name: string; node: ts.Node }[];
  visitedNames: readonly string[];
}): { name: string; node: ts.Node } | undefined => {
  if (
    !ts.isTypeReferenceNode(typeNode) ||
    !ts.isIdentifier(typeNode.typeName) ||
    typeNode.typeArguments !== undefined
  ) {
    return undefined;
  }
  const referenced = typeNode.typeName.text;
  return typeAliases.find(
    (alias) =>
      alias.name === referenced &&
      !visitedNames.some((visitedName) => visitedName === referenced),
  );
};
