/**
 * PURPOSE: Reads the plain name of an object property's key. A computed key (`[x]: 1`) and a string
 * key have no name to read and give null.
 *
 * USAGE:
 * astPropertyKeyNameTransformer({ property: propertyNodeForQuestId });
 * // Returns 'questId' for `{ questId: 1 }`, null for `{ [key]: 1 }`
 */

import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astPropertyKeyNameTransformer = ({
  property,
}: {
  property: TSESTree.Property;
}): string | null => {
  if (property.computed || property.key.type !== AST_NODE_TYPES.Identifier) {
    return null;
  }
  return property.key.name;
};
