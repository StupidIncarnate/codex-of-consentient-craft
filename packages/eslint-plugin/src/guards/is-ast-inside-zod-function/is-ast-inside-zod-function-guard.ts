/**
 * PURPOSE: True for a node that sits inside a `z.function(…)` schema: its input, its output, or a
 * call chained onto it (`.args(…)`, `.returns(…)`). A function-valued field of a contract is parsed
 * for its data only and the function sits beside the parse, so nothing inside a function schema is a
 * field of the contract, and the brand rules demand no brand there.
 *
 * USAGE:
 * isAstInsideZodFunctionGuard({ node: zObjectCallInsideFunctionInput });
 * // Returns true for the `z.object(…)` in `z.function({ input: [z.object({})] })`, false outside one
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { astZodRootMethodTransformer } from '../../transformers/ast-zod-root-method/ast-zod-root-method-transformer';

export const isAstInsideZodFunctionGuard = ({
  node,
}: {
  node?: TSESTree.Node | undefined;
}): boolean => {
  let current: TSESTree.Node | undefined = node?.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      astZodRootMethodTransformer({ node: current }) === 'function'
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};
