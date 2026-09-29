/**
 * PURPOSE: Maps each local id const to the owner that uses it as its `id`. B2's one exception is an
 * owner that points at itself (`dependsOn`, `mintedBy`) and so holds its id in an unexported const;
 * that const's brand text is the owner's plus `Id`, and a local brand no owner uses as an `id` is a
 * standalone brand.
 *
 * USAGE:
 * astLocalIdConstsTransformer({ program: programNode });
 * // Returns Map { 'workItemId' => 'workItemContract' } for `id: workItemId` in workItemContract
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { astCollectNodesTransformer } from '../ast-collect-nodes/ast-collect-nodes-transformer';
import { astProgramDeclaratorsTransformer } from '../ast-program-declarators/ast-program-declarators-transformer';

export const astLocalIdConstsTransformer = ({
  program,
}: {
  program: Tsestree;
}): Map<Identifier, Identifier> => {
  const localNames = new Set(
    astProgramDeclaratorsTransformer({ program, localOnly: true }).map(
      (declarator) => declarator.id?.name,
    ),
  );
  const idConsts = new Map<Identifier, Identifier>();

  for (const declarator of astProgramDeclaratorsTransformer({ program, localOnly: false })) {
    const ownerName = declarator.id?.name;
    if (ownerName === undefined || !declarator.init) {
      continue;
    }

    for (const property of astCollectNodesTransformer({
      node: declarator.init,
      type: 'Property',
    })) {
      // The contract types a Property's value as unknown, though ESLint always hands a node.
      const value = property.value as Tsestree | undefined;
      if (
        property.key?.type === 'Identifier' &&
        property.key.name === 'id' &&
        value?.type === 'Identifier' &&
        value.name !== undefined &&
        localNames.has(value.name)
      ) {
        idConsts.set(value.name, ownerName);
      }
    }
  }

  return idConsts;
};
