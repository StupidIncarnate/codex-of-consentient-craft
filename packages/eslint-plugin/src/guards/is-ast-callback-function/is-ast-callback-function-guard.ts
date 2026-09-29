/**
 * PURPOSE: Checks if an AST function node is used as a callback (parent is CallExpression)
 *
 * USAGE:
 * const arrowFunc = // AST node for: array.map((x) => x * 2)
 * if (isAstCallbackFunctionGuard({ funcNode: arrowFunc })) {
 *   // Function is used as a callback argument
 * }
 * // Returns true if function's parent is a CallExpression
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstCallbackFunctionGuard = ({ funcNode }: { funcNode?: TSESTree.Node }): boolean =>
  funcNode?.parent?.type === AST_NODE_TYPES.CallExpression;
