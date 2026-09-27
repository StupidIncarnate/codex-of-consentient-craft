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
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const isTypeNameReferencedLayerBroker = ({
  node,
  typeParameterName,
}: {
  node: Tsestree | null | undefined;
  typeParameterName: string;
}): boolean => {
  if (!node) {
    return false;
  }

  if (
    node.type === 'TSTypeReference' &&
    node.typeName?.type === 'Identifier' &&
    node.typeName.name === typeParameterName
  ) {
    return true;
  }

  const typeArgumentParams = (node.typeArguments ?? node.typeParameters)?.params ?? [];
  if (
    typeArgumentParams.some((param) =>
      isTypeNameReferencedLayerBroker({ node: param, typeParameterName }),
    )
  ) {
    return true;
  }

  if (isTypeNameReferencedLayerBroker({ node: node.typeAnnotation, typeParameterName })) {
    return true;
  }

  if (isTypeNameReferencedLayerBroker({ node: node.elementType, typeParameterName })) {
    return true;
  }

  const members = node.members ?? [];
  return members.some((member) =>
    isTypeNameReferencedLayerBroker({ node: member, typeParameterName }),
  );
};
