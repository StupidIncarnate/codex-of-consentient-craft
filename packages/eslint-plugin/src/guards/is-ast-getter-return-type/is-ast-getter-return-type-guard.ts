/**
 * PURPOSE: True when a node sits inside the return type annotation of an object getter or method,
 * `get children(): z.ZodArray<…>`. A self-referencing contract types its getters there, so a rule
 * about how they are typed reads this instead of judging every use of a type name in the file.
 *
 * USAGE:
 * isAstGetterReturnTypeGuard({ node: typeReferenceNode });
 * // Returns true for the `z.ZodType` in `get next(): z.ZodType<Self> {…}`, false for a field's type
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstGetterReturnTypeGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (!node) {
    return false;
  }

  let current: Tsestree = node;
  let { parent } = current;

  while (parent) {
    if (parent.type === 'FunctionExpression') {
      return parent.returnType === current && parent.parent?.type === 'Property';
    }

    current = parent;
    ({ parent } = current);
  }

  return false;
};
