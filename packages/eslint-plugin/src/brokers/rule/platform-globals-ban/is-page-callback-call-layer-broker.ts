/**
 * PURPOSE: Tells whether a node is a call to one of Playwright's browser-side methods
 * (`page.evaluate(fn)`, `locator.evaluateAll(fn)`, `page.waitForFunction(fn)`,
 * `page.addInitScript(fn)`), whose first argument runs in the driven browser. Keys on the method
 * name alone, never on the receiver's name, because the receiver is any `page`, `locator` or
 * chained `getByTestId(...)` expression.
 *
 * USAGE:
 * isPageCallbackCallLayerBroker({ node: pageEvaluateCallExpression });
 * // Returns true
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { pageCallbackMethodsStatics } from '../../../statics/page-callback-methods/page-callback-methods-statics';

export const isPageCallbackCallLayerBroker = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => {
  if (node?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) {
    return false;
  }
  const methodName = callee.property.name;
  return pageCallbackMethodsStatics.names.some((name) => name === methodName);
};
