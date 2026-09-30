/**
 * PURPOSE: Layer helper that validates proxy return objects do not expose child proxies as properties
 *
 * USAGE:
 * validateNoExposedChildProxiesLayerBroker({ objectNode, proxyVariables, context });
 * // Reports error if return object exposes child proxy via shorthand { childProxy } or explicit { child: childProxy }
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const validateNoExposedChildProxiesLayerBroker = ({
  objectNode,
  proxyVariables,
  context,
}: {
  objectNode: TSESTree.ObjectExpression;
  proxyVariables: Map<string, string>;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  for (const property of objectNode.properties) {
    if (property.type !== AST_NODE_TYPES.Property) continue;

    const { shorthand, key, value } = property;

    // Check shorthand: { fooProxy }
    if (shorthand && key.type === AST_NODE_TYPES.Identifier) {
      const proxyName = key.name;
      if (proxyVariables.has(proxyName)) {
        context.report({
          node: property,
          messageId: 'exposedChildProxy',
          data: { proxyName },
        });
      }
    }

    // Check explicit: { child: fooProxy }
    if (!shorthand && value.type === AST_NODE_TYPES.Identifier) {
      const valueName = value.name;
      if (proxyVariables.has(valueName)) {
        context.report({
          node: property,
          messageId: 'exposedChildProxy',
          data: { proxyName: valueName },
        });
      }
    }
  }
};
