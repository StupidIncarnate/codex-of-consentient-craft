/**
 * PURPOSE: Converts an implementation name to its proxy name by appending 'Proxy'
 *
 * USAGE:
 * const proxyName = implementationNameToProxyNameTransformer({ implementationName: 'userBroker' });
 * // Returns 'userBrokerProxy'
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { identifierContract } from '@dungeonmaster/shared/contracts';

export const implementationNameToProxyNameTransformer = ({
  implementationName,
}: {
  implementationName: string;
}): Identifier => identifierContract.parse(`${implementationName}Proxy`);
