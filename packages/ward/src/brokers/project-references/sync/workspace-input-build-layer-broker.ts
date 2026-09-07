/**
 * PURPOSE: Builds a WorkspaceInput by reading a project folder's tsconfig.json and package.json
 *
 * USAGE:
 * const ws = await workspaceInputBuildLayerBroker({ folder: ProjectFolderStub() });
 * // Returns WorkspaceInput with eligibility flag, package name, and dependency names
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import { packageJsonDependencyNamesTransformer } from '@dungeonmaster/shared/transformers';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  workspaceInputContract,
  type WorkspaceInput,
} from '../../../contracts/workspace-input/workspace-input-contract';
import { readTsconfigSafeLayerBroker } from './read-tsconfig-safe-layer-broker';
import { readPackageJsonSafeLayerBroker } from './read-package-json-safe-layer-broker';

export const workspaceInputBuildLayerBroker = async ({
  folder,
}: {
  folder: ProjectFolder;
}): Promise<WorkspaceInput> => {
  const tsconfigPath = filePathContract.parse(`${String(folder.path)}/tsconfig.json`);
  const pkgJsonPath = filePathContract.parse(`${String(folder.path)}/package.json`);

  const tsconfigRead = readTsconfigSafeLayerBroker({ tsconfigPath });
  const parsedPkg = await readPackageJsonSafeLayerBroker({ pkgJsonPath });

  // A tsconfig this reader could not parse leaves the package ineligible, so it is skipped rather
  // than rewritten. That was already true when an unreadable file and an absent one were the same
  // answer; it stays true now they are told apart.
  const isCompositeEligible =
    tsconfigRead.status === 'parsed' && tsconfigRead.data.compilerOptions?.noEmit !== true;

  const dependencyNames =
    parsedPkg === undefined
      ? []
      : packageJsonDependencyNamesTransformer({ packageJson: parsedPkg });

  return workspaceInputContract.parse({
    projectPath: String(folder.path),
    ...(parsedPkg?.name === undefined ? {} : { packageName: String(parsedPkg.name) }),
    dependencyNames: [...dependencyNames],
    isCompositeEligible,
  });
};
