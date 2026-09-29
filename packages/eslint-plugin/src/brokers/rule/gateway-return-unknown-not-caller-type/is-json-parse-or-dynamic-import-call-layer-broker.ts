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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isJsonParseOrDynamicImportCallLayerBroker = ({
  node,
}: {
  node: TSESTree.Node | null | undefined;
}): boolean => {
  if (!node) {
    return false;
  }

  if (node.type === AST_NODE_TYPES.ImportExpression) {
    return true;
  }

  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = node;

  return (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === 'JSON' &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'parse'
  );
};
