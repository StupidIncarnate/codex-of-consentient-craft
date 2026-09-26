/**
 * PURPOSE: Builds the absolute path to a gateway package's caller-facing testing barrel
 * (`packages/<folder>/src/testing/index.ts`) from the linted caller file's own absolute path, by
 * anchoring on the nearest `/packages/` segment — the npm-workspaces layout every consumer repo
 * has (every gateway package's testing surface sits at exactly that path, never per-subpath).
 * Returns null when the caller path carries no `/packages/` segment (a synthetic RuleTester
 * fixture outside the real repo layout, or a caller resolved some other way), so
 * enforce-proxy-child-creation can fall back to its own conservative default instead of reading a
 * path that cannot exist.
 *
 * USAGE:
 * gatewayTestingBarrelPathTransformer({
 *   callerFilePath: filePathContract.parse('/repo/packages/mcp/src/brokers/x/x-broker.proxy.ts'),
 *   gatewayFolder: 'npm',
 * });
 * // Returns '/repo/packages/npm/src/testing/index.ts' as branded FilePath
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

const PACKAGES_SEGMENT = '/packages/';

export const gatewayTestingBarrelPathTransformer = ({
  callerFilePath,
  gatewayFolder,
}: {
  callerFilePath: FilePath;
  gatewayFolder: string;
}): FilePath | null => {
  const packagesIndex = callerFilePath.indexOf(PACKAGES_SEGMENT);
  if (packagesIndex === -1) {
    return null;
  }

  const workspaceRoot = callerFilePath.slice(0, packagesIndex);
  return filePathContract.parse(`${workspaceRoot}/packages/${gatewayFolder}/src/testing/index.ts`);
};
