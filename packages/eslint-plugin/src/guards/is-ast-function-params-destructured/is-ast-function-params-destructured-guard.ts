/**
 * PURPOSE: Checks if all function parameters use object destructuring pattern
 *
 * USAGE:
 * const funcNode = // AST node for: ({ name, age }: User) => void
 * if (isAstFunctionParamsDestructuredGuard({ funcNode })) {
 *   // All parameters use destructuring
 * }
 * // Returns true if all params are ObjectPattern or AssignmentPattern with ObjectPattern
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstFunctionParamsDestructuredGuard = ({
  funcNode,
}: {
  funcNode?: Tsestree;
}): boolean => {
  if (!funcNode?.params || funcNode.params.length === 0) {
    return true; // No params means no violation
  }

  // Check if ALL parameters use object destructuring
  // Handle two cases:
  // 1. Direct ObjectPattern: ({ x }: { x: Type })
  // 2. AssignmentPattern with ObjectPattern left: ({ x = 5 } = {})
  return funcNode.params.every(
    (param) =>
      param.type === 'ObjectPattern' ||
      (param.type === 'AssignmentPattern' && param.left?.type === 'ObjectPattern'),
  );
};
