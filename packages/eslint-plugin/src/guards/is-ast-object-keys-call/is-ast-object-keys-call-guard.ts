/**
 * PURPOSE: Checks if an AST node is an Object.keys(...) call expression
 *
 * USAGE:
 * isAstObjectKeysCallGuard({ node });
 * // Returns true if node represents Object.keys(...)
 *
 * WHEN-TO-USE: When ESLint rules need to detect Object.keys() usage in expect() arguments
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstObjectKeysCallGuard = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): boolean => {
  if (node === undefined || node === null) {
    return false;
  }

  if (node.type !== 'CallExpression') {
    return false;
  }

  const { callee } = node;
  if (callee?.type !== 'MemberExpression') {
    return false;
  }

  if (callee.object?.type !== 'Identifier' || callee.object.name !== 'Object') {
    return false;
  }

  return callee.property?.name === 'keys';
};
