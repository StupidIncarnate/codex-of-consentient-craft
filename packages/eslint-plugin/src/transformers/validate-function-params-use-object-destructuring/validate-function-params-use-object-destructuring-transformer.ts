import type { EslintContext } from '../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const validateFunctionParamsUseObjectDestructuringTransformer = ({
  node,
  context,
}: {
  node: Tsestree;
  context: EslintContext;
}): void => {
  // No params is fine
  if (!node.params || node.params.length === 0) {
    return;
  }

  // Check each parameter - all must use object destructuring
  for (const param of node.params) {
    // Check if parameter uses object destructuring
    const isObjectDestructuring =
      param.type === 'ObjectPattern' ||
      (param.type === 'AssignmentPattern' && param.left?.type === 'ObjectPattern');

    if (!isObjectDestructuring) {
      context.report({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    }
  }
};
