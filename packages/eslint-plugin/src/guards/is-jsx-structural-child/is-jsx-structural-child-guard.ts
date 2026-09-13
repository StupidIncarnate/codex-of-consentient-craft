/**
 * PURPOSE: Decides whether one child of a JSX element contributes STRUCTURE — another element —
 * rather than just a value. Reach for this over checking `children.length`: whitespace between tags
 * arrives as a JSXText child, so a length check calls `<Text>{label}</Text>` a tree and every rule
 * built on it fires on leaves.
 *
 * USAGE:
 * isJsxStructuralChildGuard({ child });
 * // Returns true for <Text/>, for {cond ? <A/> : null}, and false for {label} or raw text
 */
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isJsxStructuralChildGuard = ({ child }: { child?: Tsestree }): boolean => {
  if (!child) {
    return false;
  }

  const { JSXElement, JSXFragment, JSXExpressionContainer } = tsestreeNodeTypeStatics.nodeTypes;

  if (child.type === JSXElement || child.type === JSXFragment) {
    return true;
  }

  if (child.type !== JSXExpressionContainer) {
    return false;
  }

  // A braced child holds structure when the expression it wraps RESOLVES to an element. The three
  // shapes below are how conditional and mapped markup reaches this position; anything else in
  // braces is a value being interpolated, which is a leaf.
  const { expression } = child;
  if (!expression) {
    return false;
  }

  if (expression.type === JSXElement || expression.type === JSXFragment) {
    return true;
  }

  const branches = [expression.consequent, expression.alternate, expression.right];
  return branches.some(
    (branch) =>
      !Array.isArray(branch) &&
      Boolean(branch) &&
      (branch?.type === JSXElement || branch?.type === JSXFragment),
  );
};
