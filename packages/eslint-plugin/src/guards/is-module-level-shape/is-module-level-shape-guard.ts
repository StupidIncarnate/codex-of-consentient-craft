/**
 * PURPOSE: Tells whether a declaration at module level carries a type that holds a data object
 * literal, the one shape `ban-adhoc-types` refuses when its `checkModuleLevelShapes` option is on.
 * A declaration inside a function never leaves it, so its local totals and reduce accumulators
 * pass; a method set (every member a function) passes too.
 *
 * USAGE:
 * isModuleLevelShapeGuard({ node: aliasDeclaration, typeNode: aliasDeclaration.typeAnnotation });
 * // Returns true for a top-level `type CarveResult = { ok: true } | { ok: false }`, false inside a function body
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { hasDataObjectLiteralTypeGuard } from '../has-data-object-literal-type/has-data-object-literal-type-guard';
import { isAstNodeInsideFunctionGuard } from '../is-ast-node-inside-function/is-ast-node-inside-function-guard';

export const isModuleLevelShapeGuard = ({
  node,
  typeNode,
}: {
  node?: Tsestree | undefined;
  typeNode?: Tsestree | null | undefined;
}): boolean =>
  node !== undefined &&
  !isAstNodeInsideFunctionGuard({ node }) &&
  hasDataObjectLiteralTypeGuard({ node: typeNode });
