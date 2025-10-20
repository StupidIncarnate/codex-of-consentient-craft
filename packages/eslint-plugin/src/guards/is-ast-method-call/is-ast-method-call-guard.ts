import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstMethodCallGuard = ({
  node,
  object,
  method,
}: {
  node?: Tsestree;
  object?: string;
  method?: string;
}): boolean =>
  node?.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === object &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === method;
