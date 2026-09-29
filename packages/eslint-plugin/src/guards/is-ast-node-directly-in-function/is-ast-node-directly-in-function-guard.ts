/**
 * PURPOSE: Tells whether an AST node sits directly inside a given function's own body — reachable
 * by walking `.parent` without crossing a DIFFERENT function boundary first. Reach for this over
 * `isAstNodeInsideFunctionGuard` (which answers "inside ANY function at all", always true from
 * inside the function you are checking) when what you need is "did this run eagerly when
 * `functionNode` itself ran, or is it deferred inside a nested closure that function returns" — a
 * proxy's child-proxy creation is legitimate directly in the constructor OR directly in the
 * returned value's own expression (`return { ...childProxy() }`, same as an implicit-return
 * `() => ({ ...childProxy() })`), but not inside a method the returned object exposes
 * (`return { setup: () => { childProxy(); } }`), which is exactly the boundary this guard draws.
 *
 * USAGE:
 * isAstNodeDirectlyInFunctionGuard({ node: callExpressionNode, functionNode: proxyArrowFunctionNode });
 * // Returns true when node.parent chain reaches functionNode before any other function node
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstNodeDirectlyInFunctionGuard = ({
  node,
  functionNode,
}: {
  node?: TSESTree.Node | undefined;
  functionNode?: TSESTree.Node | undefined;
}): boolean => {
  if (node === undefined || functionNode === undefined) {
    return false;
  }

  let current = node.parent;
  while (current) {
    if (current === functionNode) {
      return true;
    }
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
};
