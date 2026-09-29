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
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { astCollectNodesTransformer } from '../ast-collect-nodes/ast-collect-nodes-transformer';
import { astProgramDeclaratorsTransformer } from '../ast-program-declarators/ast-program-declarators-transformer';

export const astFieldListOwnersTransformer = ({
  program,
}: {
  program: TSESTree.Program;
}): Map<Identifier, Identifier> => {
  const localNames = new Set(
    astProgramDeclaratorsTransformer({ program, localOnly: true }).map((declarator) =>
      declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : undefined,
    ),
  );
  const owners = new Map<Identifier, Identifier>();

  for (const declarator of astProgramDeclaratorsTransformer({ program, localOnly: false })) {
    const ownerName =
      declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : undefined;
    if (ownerName === undefined || !declarator.init) {
      continue;
    }

    for (const spread of astCollectNodesTransformer({
      node: declarator.init,
      type: AST_NODE_TYPES.SpreadElement,
    })) {
      if (
        spread.type === AST_NODE_TYPES.SpreadElement &&
        spread.argument.type === AST_NODE_TYPES.MemberExpression &&
        spread.argument.object.type === AST_NODE_TYPES.Identifier &&
        spread.argument.property.type === AST_NODE_TYPES.Identifier &&
        spread.argument.property.name === 'shape' &&
        localNames.has(spread.argument.object.name)
      ) {
        owners.set(
          identifierContract.parse(spread.argument.object.name),
          identifierContract.parse(ownerName),
        );
      }
    }
  }

  return owners;
};
