import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

/**
 * Converts an implementation name to its proxy name by appending 'Proxy'.
 * Example: 'userBroker' -> 'userBrokerProxy'
 */
export const implementationNameToProxyNameTransformer = ({
  implementationName,
}: {
  implementationName: string;
}): Identifier => identifierContract.parse(`${implementationName}Proxy`);
