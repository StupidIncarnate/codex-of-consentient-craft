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
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { pageCallbackMethodsStatics } from '../../../statics/page-callback-methods/page-callback-methods-statics';

export const isPageCallbackCallLayerBroker = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): boolean => {
  if (node?.type !== 'CallExpression') {
    return false;
  }
  const { callee } = node;
  if (callee?.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }
  const methodName = callee.property?.name;
  return pageCallbackMethodsStatics.names.some((name) => name === methodName);
};
