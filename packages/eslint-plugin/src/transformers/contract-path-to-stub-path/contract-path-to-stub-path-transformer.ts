import { modulePathContract } from '@questmaestro/shared/contracts';
import type { ModulePath } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Converts a contract file path to its corresponding stub file path
 *
 * USAGE:
 * const stubPath = contractPathToStubPathTransformer({ contractPath: 'user-contract.ts' });
 * // Returns 'user.stub'
 * const stubPath2 = contractPathToStubPathTransformer({ contractPath: './contracts/user-contract' });
 * // Returns './contracts/user.stub'
 *
 * WHEN-TO-USE: When suggesting stub imports instead of contract imports in test files
 */
export const contractPathToStubPathTransformer = ({
  contractPath,
}: {
  contractPath: string;
}): ModulePath => {
  const stubPath = contractPath.replace(/-contract(\.ts)?$/u, '.stub');

  return modulePathContract.parse(stubPath);
};
