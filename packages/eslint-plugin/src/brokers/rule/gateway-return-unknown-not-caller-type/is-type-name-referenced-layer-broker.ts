/**
 * PURPOSE: Walks a type-annotation subtree looking for a bare reference to one exact name —
 * `gateway-return-unknown-not-caller-type` uses this on a function's own PARAMETER types, to tell
 * a type parameter that only forwards the caller's own value through unchanged (left alone) from
 * one invented fresh inside the function (refused). Recurses through the shapes this repo's
 * single-object-parameter convention produces: the `TSTypeAnnotation` wrapper, an inline
 * `TSTypeLiteral`'s `members`, a `TSArrayType`'s `elementType`, and a `TSTypeReference`'s own type
 * arguments (`Array<T>`).
 *
 * USAGE:
 * isTypeNameReferencedLayerBroker({ node: paramNode, typeParameterName: 'T' });
 * // Returns true for a parameter typed `T`, `T[]`, `Array<T>`, or `{ value: T }`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isTypeNameReferencedLayerBroker = ({
  node,
  typeParameterName,
}: {
  node: TSESTree.Node | null | undefined;
  typeParameterName: string;
}): boolean => {
  if (!node) {
    return false;
  }

  if (
    node.type === AST_NODE_TYPES.TSTypeReference &&
    node.typeName.type === AST_NODE_TYPES.Identifier &&
    node.typeName.name === typeParameterName
  ) {
    return true;
  }

  const typeArgumentParams =
    (
      ('typeArguments' in node ? node.typeArguments : undefined) ??
      ('typeParameters' in node ? node.typeParameters : undefined)
    )?.params ?? [];
  if (
    typeArgumentParams.some((param) =>
      isTypeNameReferencedLayerBroker({ node: param, typeParameterName }),
    )
  ) {
    return true;
  }

  if (
    isTypeNameReferencedLayerBroker({
      node: 'typeAnnotation' in node ? node.typeAnnotation : undefined,
      typeParameterName,
    })
  ) {
    return true;
  }

  if (
    isTypeNameReferencedLayerBroker({
      node:
        node.type === AST_NODE_TYPES.TSArrayType || node.type === AST_NODE_TYPES.TSNamedTupleMember
          ? node.elementType
          : undefined,
      typeParameterName,
    })
  ) {
    return true;
  }

  const members =
    (node.type === AST_NODE_TYPES.TSEnumDeclaration ? node.body.members : undefined) ??
    (node.type === AST_NODE_TYPES.TSEnumBody || node.type === AST_NODE_TYPES.TSTypeLiteral
      ? node.members
      : undefined) ??
    [];
  return members.some((member) =>
    isTypeNameReferencedLayerBroker({ node: member, typeParameterName }),
  );
};
