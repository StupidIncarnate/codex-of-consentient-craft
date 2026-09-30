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

import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { astCollectNodesTransformer } from '../ast-collect-nodes/ast-collect-nodes-transformer';
import { astProgramDeclaratorsTransformer } from '../ast-program-declarators/ast-program-declarators-transformer';

export const astLocalIdConstsTransformer = ({
  program,
}: {
  program: TSESTree.Program;
}): Map<string, string> => {
  const localNames = new Set(
    astProgramDeclaratorsTransformer({ program, localOnly: true }).map((declarator) =>
      declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : undefined,
    ),
  );
  const idConsts = new Map<string, string>();

  for (const declarator of astProgramDeclaratorsTransformer({ program, localOnly: false })) {
    const ownerName =
      declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : undefined;
    if (ownerName === undefined || !declarator.init) {
      continue;
    }

    for (const property of astCollectNodesTransformer({
      node: declarator.init,
      type: AST_NODE_TYPES.Property,
    })) {
      if (
        property.type === AST_NODE_TYPES.Property &&
        property.key.type === AST_NODE_TYPES.Identifier &&
        property.key.name === 'id' &&
        property.value.type === AST_NODE_TYPES.Identifier &&
        localNames.has(property.value.name)
      ) {
        idConsts.set(property.value.name, ownerName);
      }
    }
  }

  return idConsts;
};
