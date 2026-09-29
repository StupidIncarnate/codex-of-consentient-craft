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
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isPageCallbackCallLayerBroker } from './is-page-callback-call-layer-broker';

export const isInsideInlinePageCallbackLayerBroker = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): boolean => {
  if (node === null || node === undefined) {
    return false;
  }
  const isFunctionLiteral =
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
  if (
    isFunctionLiteral &&
    isPageCallbackCallLayerBroker({ node: node.parent }) &&
    node.parent?.arguments?.[0] === node
  ) {
    return true;
  }
  return isInsideInlinePageCallbackLayerBroker({ node: node.parent });
};
