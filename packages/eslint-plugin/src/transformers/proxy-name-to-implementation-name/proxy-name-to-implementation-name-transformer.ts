import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const proxyNameToImplementationNameTransformer = ({
  proxyName,
}: {
  proxyName: string;
}): Identifier => {
  const implementationName = proxyName.replace(/Proxy$/u, '');

  return identifierContract.parse(implementationName);
};
