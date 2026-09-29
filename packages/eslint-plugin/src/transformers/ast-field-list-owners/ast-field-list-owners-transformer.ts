/**
 * PURPOSE: Maps each local field list to the contract that spreads it. A self-referencing contract
 * keeps its fields in an unexported `z.object` and spreads `...fields.shape` into the owner, so
 * that list has no brand of its own and its leaves and its `Self` type are the owner's. Only a file
 * read is needed: the spread and the const are in the same file.
 *
 * USAGE:
 * astFieldListOwnersTransformer({ program: programNode });
 * // Returns Map { 'treeNodeFields' => 'treeNodeContract' }
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { astCollectNodesTransformer } from '../ast-collect-nodes/ast-collect-nodes-transformer';
import { astProgramDeclaratorsTransformer } from '../ast-program-declarators/ast-program-declarators-transformer';

export const astFieldListOwnersTransformer = ({
  program,
}: {
  program: Tsestree;
}): Map<Identifier, Identifier> => {
  const localNames = new Set(
    astProgramDeclaratorsTransformer({ program, localOnly: true }).map(
      (declarator) => declarator.id?.name,
    ),
  );
  const owners = new Map<Identifier, Identifier>();

  for (const declarator of astProgramDeclaratorsTransformer({ program, localOnly: false })) {
    const ownerName = declarator.id?.name;
    if (ownerName === undefined || !declarator.init) {
      continue;
    }

    for (const spread of astCollectNodesTransformer({
      node: declarator.init,
      type: 'SpreadElement',
    })) {
      const { argument } = spread;
      const listName = argument?.object?.type === 'Identifier' ? argument.object.name : undefined;
      if (
        argument?.type === 'MemberExpression' &&
        argument.property?.name === 'shape' &&
        listName !== undefined &&
        localNames.has(listName)
      ) {
        owners.set(listName, ownerName);
      }
    }
  }

  return owners;
};
