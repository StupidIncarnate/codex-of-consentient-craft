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
