import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstMemberExpressionGuard = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): boolean => node !== null && node !== undefined && node.type === 'MemberExpression';
