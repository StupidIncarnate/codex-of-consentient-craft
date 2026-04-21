/**
 * PURPOSE: Layer helper that validates proxy return objects do not expose child proxies as properties
 *
 * USAGE:
 * validateNoExposedChildProxiesLayerBroker({ objectNode, proxyVariables, context });
 * // Reports error if return object exposes child proxy via shorthand { childProxy } or explicit { child: childProxy }
 */
import type { AdapterResult, Identifier } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const validateNoExposedChildProxiesLayerBroker = ({
  objectNode,
  proxyVariables,
  context,
}: {
  objectNode: Tsestree;
  proxyVariables: Map<Identifier, Identifier>;
  context: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const { properties } = objectNode;

  if (!properties) return result;

  for (const property of properties) {
    if (property.type !== 'Property') continue;

    const { shorthand, key, value } = property;

    // Check shorthand: { fooProxy }
    if (shorthand && key?.name) {
      if (proxyVariables.has(key.name)) {
        context.report({
          node: property,
          messageId: 'exposedChildProxy',
          data: { proxyName: key.name },
        });
      }
    }

    // Check explicit: { child: fooProxy }
    // value is typed as unknown from Tsestree contract, need to check it's an Identifier node
    if (
      !shorthand &&
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'type' in value &&
      value.type === 'Identifier' &&
      'name' in value
    ) {
      const valueName = value.name as Identifier | undefined;
      if (valueName && proxyVariables.has(valueName)) {
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
