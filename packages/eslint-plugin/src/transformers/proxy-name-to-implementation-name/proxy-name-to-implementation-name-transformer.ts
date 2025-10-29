import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Converts a proxy variable name to its implementation name by removing 'Proxy' suffix
 *
 * USAGE:
 * const implName = proxyNameToImplementationNameTransformer({ proxyName: 'userBrokerProxy' });
 * // Returns: 'userBroker'
 *
 * const anotherName = proxyNameToImplementationNameTransformer({ proxyName: 'httpAdapterProxy' });
 * // Returns: 'httpAdapter'
 */
export const proxyNameToImplementationNameTransformer = ({
  proxyName,
}: {
  proxyName: string;
}): Identifier => {
  const implementationName = proxyName.replace(/Proxy$/u, '');

  return identifierContract.parse(implementationName);
};
