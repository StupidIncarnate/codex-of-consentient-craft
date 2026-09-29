/**
 * PURPOSE: Reads the plain name of an object property's key. A computed key (`[x]: 1`) and a string
 * key have no name to read and give null.
 *
 * USAGE:
 * astPropertyKeyNameTransformer({ property: propertyNodeForQuestId });
 * // Returns 'questId' for `{ questId: 1 }`, null for `{ [key]: 1 }`
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astPropertyKeyNameTransformer = ({
  property,
}: {
  property: Tsestree;
}): Identifier | null => {
  const { key } = property;
  if (property.computed === true || key?.type !== 'Identifier' || key.name === undefined) {
    return null;
  }
  return key.name;
};
