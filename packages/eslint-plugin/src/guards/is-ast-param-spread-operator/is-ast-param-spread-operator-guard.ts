import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * PURPOSE: Checks if function's first parameter uses spread/rest operator in destructuring
 *
 * USAGE:
 * const funcNode = // AST node for: ({ ...props }: Props) => void
 * if (isAstParamSpreadOperatorGuard({ funcNode })) {
 *   // Function uses spread/rest operator in first parameter
 * }
 * // Returns true if first param is ObjectPattern with single RestElement property
 */
export const isAstParamSpreadOperatorGuard = ({ funcNode }: { funcNode?: Tsestree }): boolean => {
  if (!funcNode?.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Handle both ObjectPattern and AssignmentPattern wrapping ObjectPattern
  const pattern =
    firstParam.type === 'ObjectPattern'
      ? firstParam
      : firstParam.type === 'AssignmentPattern' && firstParam.left
        ? firstParam.left
        : null;

  if (!pattern || pattern.type !== 'ObjectPattern') {
    return false;
  }

  const { properties } = pattern;
  if (!properties || properties.length === 0) {
    return false;
  }

  // Must have exactly one property and it must be a RestElement
  return properties.length === 1 && properties[0]?.type === 'RestElement';
};
