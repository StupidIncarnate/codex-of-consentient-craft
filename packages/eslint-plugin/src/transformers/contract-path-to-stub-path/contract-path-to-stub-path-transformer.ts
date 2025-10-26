import { modulePathContract } from '@questmaestro/shared/contracts';
import type { ModulePath } from '@questmaestro/shared/contracts';

export const contractPathToStubPathTransformer = ({
  contractPath,
}: {
  contractPath: string;
}): ModulePath => {
  const stubPath = contractPath.replace(/-contract(\.ts)?$/u, '.stub');

  return modulePathContract.parse(stubPath);
};
