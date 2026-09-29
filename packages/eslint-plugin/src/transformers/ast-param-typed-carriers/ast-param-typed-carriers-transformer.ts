/**
 * PURPOSE: Lists the nodes of one function parameter that carry a name and a written type: the
 * parameter itself when it is a plain identifier (`questId: string`), or each property signature of
 * the inline type literal a destructured parameter is typed with (`{ questId }: { questId: string }`).
 * A parameter with a default is read through its left side. A carrier's name is its own `name`
 * (identifier) or its key's `name` (property signature); its type is `typeAnnotation.typeAnnotation`.
 *
 * USAGE:
 * astParamTypedCarriersTransformer({ param: destructuredParamNode });
 * // Returns the TSPropertySignature nodes of `{ questId: string; label: string }`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astParamTypedCarriersTransformer = ({
  param,
}: {
  param: TSESTree.Parameter;
}): (TSESTree.Identifier | TSESTree.TSPropertySignature)[] => {
  const target = param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

  if (target.type === AST_NODE_TYPES.Identifier) {
    return target.typeAnnotation?.typeAnnotation ? [target] : [];
  }

  if (
    target.type === AST_NODE_TYPES.ObjectPattern &&
    target.typeAnnotation?.typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral
  ) {
    return target.typeAnnotation.typeAnnotation.members.flatMap((member) =>
      member.type === AST_NODE_TYPES.TSPropertySignature &&
      member.key.type === AST_NODE_TYPES.Identifier &&
      !member.computed &&
      member.typeAnnotation !== undefined
        ? [member]
        : [],
    );
  }

  return [];
};
