/**
 * PURPOSE: Reads one named property's value node out of an object literal's `properties` list — the
 * RHS of `{command: 'git'}`'s `command` property, for example. A Property node's `value` rides the
 * tsestree contract's untyped `value` slot (shared with Literal.value in real ESTree), so the match
 * is narrowed back to a node by an `in` check on its own shape, not a cast past the contract.
 *
 * USAGE:
 * objectPropertyValueTransformer({ properties: objectExpressionNode.properties ?? [], name: 'command' });
 * // Returns the `command` property's value node, or undefined when no such property exists
 */
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isNamedObjectPropertyGuard } from '../../guards/is-named-object-property/is-named-object-property-guard';

export const objectPropertyValueTransformer = ({
  properties,
  name,
}: {
  properties: readonly TSESTree.Node[];
  name: string;
}): TSESTree.Node | undefined => {
  const matchingProperty = properties.find((property) =>
    isNamedObjectPropertyGuard({ property, name }),
  );
  const rawValue =
    matchingProperty && 'value' in matchingProperty ? matchingProperty.value : undefined;
  return rawValue !== null && typeof rawValue === 'object' && 'type' in rawValue
    ? (rawValue as TSESTree.Node)
    : undefined;
};
