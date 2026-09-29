/**
 * PURPOSE: Layer helper that validates proxy return objects do not expose child proxies as properties
 *
 * USAGE:
 * validateNoExposedChildProxiesLayerBroker({ objectNode, proxyVariables, context });
 * // Reports error if return object exposes child proxy via shorthand { childProxy } or explicit { child: childProxy }
 */
import type { AdapterResult, Identifier } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, identifierContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const validateNoExposedChildProxiesLayerBroker = ({
  objectNode,
  proxyVariables,
  context,
}: {
  objectNode: TSESTree.ObjectExpression;
  proxyVariables: Map<Identifier, Identifier>;
  context: TSESLint.RuleContext<string, unknown[]>;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });

  for (const property of objectNode.properties) {
    if (property.type !== AST_NODE_TYPES.Property) continue;

    const { shorthand, key, value } = property;

    // Check shorthand: { fooProxy }
    if (shorthand && key.type === AST_NODE_TYPES.Identifier) {
      const proxyName = identifierContract.parse(key.name);
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
      const valueName = identifierContract.parse(value.name);
      if (proxyVariables.has(valueName)) {
        context.report({
          node: property,
          messageId: 'exposedChildProxy',
          data: { proxyName: valueName },
        });
      }
    }
  }
  return result;
};
