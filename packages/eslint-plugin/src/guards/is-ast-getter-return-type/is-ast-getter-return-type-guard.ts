/**
 * PURPOSE: True when a node sits inside the return type annotation of an object getter or method,
 * `get children(): z.ZodArray<…>`. A self-referencing contract types its getters there, so a rule
 * about how they are typed reads this instead of judging every use of a type name in the file.
 *
 * USAGE:
 * isAstGetterReturnTypeGuard({ node: typeReferenceNode });
 * // Returns true for the `z.ZodType` in `get next(): z.ZodType<Self> {…}`, false for a field's type
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstGetterReturnTypeGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
  if (!node) {
    return false;
  }

  let current: TSESTree.Node = node;
  let { parent } = current;

  while (parent) {
    if (parent.type === AST_NODE_TYPES.FunctionExpression) {
      return parent.returnType === current && parent.parent.type === AST_NODE_TYPES.Property;
    }

    current = parent;
    ({ parent } = current);
  }

  return false;
};
