/**
 * PURPOSE: Determines if an AST node is a `process.cwd()` call expression
 *
 * USAGE:
 * if (isProcessCwdCallGuard({ node })) {
 *   // Returns true when node is `process.cwd()`
 * }
 *
 * WHEN-TO-USE: Inside ESLint rules that need to flag bare process.cwd() invocations
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isProcessCwdCallGuard = ({ node }: { node?: Tsestree | undefined }): boolean => {
  if (!node || node.type !== 'CallExpression') {
    return false;
  }
  const { callee } = node;
  if (!callee || callee.type !== 'MemberExpression') {
    return false;
  }
  const objectName = callee.object?.name;
  const propertyName = callee.property?.name;
  return objectName === 'process' && propertyName === 'cwd';
};
