/**
 * PURPOSE: Tells whether a node is a direct `JSON.parse(...)` call or a dynamic `import(...)`
 * expression — the two Node/browser-lib operations that hand back `any` (`JSON.parse`) or
 * `Promise<any>` (`import()`) with no cast in between. `gateway-return-unknown-not-caller-type`
 * uses this to spot that `any` leaving a function with no declared return type.
 *
 * USAGE:
 * isJsonParseOrDynamicImportCallLayerBroker({ node: jsonParseCallNode });
 * // Returns true
 * isJsonParseOrDynamicImportCallLayerBroker({ node: someOtherCallNode });
 * // Returns false
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const isJsonParseOrDynamicImportCallLayerBroker = ({
  node,
}: {
  node: Tsestree | null | undefined;
}): boolean => {
  if (!node) {
    return false;
  }

  if (node.type === 'ImportExpression') {
    return true;
  }

  if (node.type !== 'CallExpression') {
    return false;
  }

  const { callee } = node;

  return (
    callee?.type === 'MemberExpression' &&
    callee.object?.type === 'Identifier' &&
    callee.object.name === 'JSON' &&
    callee.property?.type === 'Identifier' &&
    callee.property.name === 'parse'
  );
};
