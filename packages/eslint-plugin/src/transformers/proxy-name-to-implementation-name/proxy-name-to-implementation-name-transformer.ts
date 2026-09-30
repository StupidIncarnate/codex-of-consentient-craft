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
}): string => {
  const implementationName = proxyName.replace(/Proxy$/u, '');

  return implementationName;
};
