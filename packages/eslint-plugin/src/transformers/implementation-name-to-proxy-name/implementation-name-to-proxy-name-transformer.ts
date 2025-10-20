/**
 * Converts an implementation name to its proxy name by appending 'Proxy'.
 * Example: 'userBroker' -> 'userBrokerProxy'
 */
export const implementationNameToProxyNameTransformer = ({
  implementationName,
}: {
  implementationName: string;
}): string => {
  return `${implementationName}Proxy`;
};
