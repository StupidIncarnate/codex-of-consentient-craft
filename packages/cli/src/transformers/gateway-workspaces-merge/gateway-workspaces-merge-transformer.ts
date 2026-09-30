/**
 * PURPOSE: Adds `"packages/@gateway/*"` to the root package.json `workspaces` array so npm links the
 * four scaffolded gateway packages, keeping every existing entry and its order. Returns the SAME
 * `rootPackageJson` reference when the glob is already present, so a caller can skip a write with
 * `updated === rootPackageJson`.
 *
 * USAGE:
 * gatewayWorkspacesMergeTransformer({ rootPackageJson: PackageJsonRawStub({workspaces: ['packages/*']}) });
 * // Returns rootPackageJson with workspaces: ['packages/*', 'packages/@gateway/*']
 */

import { packageJsonRawContract, type PackageJsonRaw } from '@dungeonmaster/shared/contracts';

const GATEWAY_WORKSPACE_GLOB = 'packages/@gateway/*';

export const gatewayWorkspacesMergeTransformer = ({
  rootPackageJson,
}: {
  rootPackageJson: PackageJsonRaw;
}): PackageJsonRaw => {
  const workspacesKey = packageJsonRawContract.keyType.parse('workspaces');
  const existingValue = rootPackageJson[workspacesKey];
  const existingWorkspaces = Array.isArray(existingValue)
    ? existingValue.filter((entry) => typeof entry === 'string')
    : [];

  if (existingWorkspaces.includes(GATEWAY_WORKSPACE_GLOB)) {
    return rootPackageJson;
  }

  return {
    ...rootPackageJson,
    [workspacesKey]: [...existingWorkspaces, GATEWAY_WORKSPACE_GLOB],
  };
};
