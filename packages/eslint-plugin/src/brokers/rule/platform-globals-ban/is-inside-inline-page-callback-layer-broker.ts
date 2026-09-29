/**
 * PURPOSE: Tells whether a node sits anywhere inside a function literal written directly as the
 * FIRST argument of a Playwright browser-side call — `page.evaluate(() => document.title)`,
 * `locator.evaluateAll((els) => ...)`. That function's source is shipped to the driven browser and
 * runs there, so a DOM global inside it is the browser's own, not the calling process's. A later
 * argument (`page.evaluate(fn, arg)`'s `arg`) is built in Node and is never exempt. A function
 * passed BY NAME is enclosingFunctionBindingNamesLayerBroker's case, not this one's.
 *
 * USAGE:
 * isInsideInlinePageCallbackLayerBroker({ node: documentIdentifierInsideEvaluateArrow });
 * // Returns true
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isPageCallbackCallLayerBroker } from './is-page-callback-call-layer-broker';

export const isInsideInlinePageCallbackLayerBroker = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => {
  if (node === null || node === undefined) {
    return false;
  }
  const isFunctionLiteral =
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression;
  if (
    isFunctionLiteral &&
    isPageCallbackCallLayerBroker({ node: node.parent }) &&
    (node.parent.type === AST_NODE_TYPES.CallExpression ||
    node.parent.type === AST_NODE_TYPES.NewExpression
      ? node.parent.arguments[0]
      : undefined) === node
  ) {
    return true;
  }
  return isInsideInlinePageCallbackLayerBroker({ node: node.parent });
};
