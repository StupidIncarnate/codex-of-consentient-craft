/**
 * PURPOSE: Converts an implementation name to its proxy name by appending 'Proxy'
 *
 * USAGE:
 * const proxyName = implementationNameToProxyNameTransformer({ implementationName: 'userBroker' });
 * // Returns 'userBrokerProxy'
 */
import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

export const implementationNameToProxyNameTransformer = ({
  implementationName,
}: {
  implementationName: string;
}): Identifier => identifierContract.parse(`${implementationName}Proxy`);
