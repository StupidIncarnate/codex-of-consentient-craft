import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

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
export const isAstCallbackFunctionGuard = ({ funcNode }: { funcNode?: Tsestree }): boolean =>
  funcNode?.parent?.type === 'CallExpression';
