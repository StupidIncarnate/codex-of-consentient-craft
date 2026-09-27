/**
 * PURPOSE: Builds the absolute path to one gateway subpath's caller-facing testing barrel
 * (`packages/@gateway/<folder>/src/<subpath>/<subpath>.proxy.ts`) from the linted caller file's own
 * absolute path, by anchoring on the nearest `/packages/` segment — the npm-workspaces layout every
 * consumer repo has. Returns null when the caller path carries no `/packages/` segment (a synthetic
 * RuleTester fixture outside the real repo layout, or a caller resolved some other way), so
 * enforce-proxy-child-creation can fall back to its own conservative default instead of reading a
 * path that cannot exist.
 *
 * USAGE:
 * gatewayTestingBarrelPathTransformer({
 *   callerFilePath: filePathContract.parse('/repo/packages/mcp/src/brokers/x/x-broker.proxy.ts'),
 *   gatewayFolder: 'node',
 *   subpath: 'fs__promises',
 * });
 * // Returns '/repo/packages/@gateway/node/src/fs__promises/fs__promises.proxy.ts' as branded FilePath
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

const PACKAGES_SEGMENT = '/packages/';

export const gatewayTestingBarrelPathTransformer = ({
  callerFilePath,
  gatewayFolder,
  subpath,
}: {
  callerFilePath: FilePath;
  gatewayFolder: string;
  subpath: string;
}): FilePath | null => {
  const packagesIndex = callerFilePath.indexOf(PACKAGES_SEGMENT);
  if (packagesIndex === -1) {
    return null;
  }

  const workspaceRoot = callerFilePath.slice(0, packagesIndex);
  return filePathContract.parse(
    `${workspaceRoot}/packages/@gateway/${gatewayFolder}/src/${subpath}/${subpath}.proxy.ts`,
  );
};
