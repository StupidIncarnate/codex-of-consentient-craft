/**
 * PURPOSE: Converts an implementation name to its proxy name by appending 'Proxy'
 *
 * USAGE:
 * const proxyName = implementationNameToProxyNameTransformer({ implementationName: 'userBroker' });
 * // Returns 'userBrokerProxy'
 */

export const implementationNameToProxyNameTransformer = ({
  implementationName,
}: {
  implementationName: string;
}): string => `${implementationName}Proxy`;
