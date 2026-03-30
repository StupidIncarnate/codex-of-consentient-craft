/**
 * PURPOSE: Checks if an AST node is a .includes(...) call expression
 *
 * USAGE:
 * isAstIncludesCallGuard({ node });
 * // Returns true if node represents something.includes(...)
 *
 * WHEN-TO-USE: When ESLint rules need to detect .includes() usage in expect() arguments
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstIncludesCallGuard = ({
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

  return callee.property?.name === 'includes';
};
