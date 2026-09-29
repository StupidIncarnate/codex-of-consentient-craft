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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astParamTypedCarriersTransformer = ({ param }: { param: Tsestree }): Tsestree[] => {
  const target = param.type === 'AssignmentPattern' && param.left ? param.left : param;
  const annotated = target.typeAnnotation?.typeAnnotation;

  if (target.type === 'Identifier') {
    return annotated ? [target] : [];
  }

  if (target.type === 'ObjectPattern' && annotated?.type === 'TSTypeLiteral') {
    return (annotated.members ?? []).filter(
      (member) =>
        member.type === 'TSPropertySignature' &&
        member.key?.type === 'Identifier' &&
        member.computed !== true &&
        member.typeAnnotation?.typeAnnotation !== undefined,
    );
  }

  return [];
};
