/**
 * PURPOSE: Builds the absolute path to one gateway subpath's own production barrel
 * (`packages/@gateway/<folder>/src/<subpath>/<subpath>.ts`) from the linted caller file's own
 * absolute path, by anchoring on the nearest `/packages/` segment — the npm-workspaces layout every
 * consumer repo has. Returns null when the caller path carries no `/packages/` segment (a synthetic
 * RuleTester fixture outside the real repo layout, or a caller resolved some other way), so
 * enforce-proxy-child-creation can fall back to its own conservative default instead of reading a
 * path that cannot exist. The production barrel is what maps an exported name to the wrapper folder
 * that declares it, so this stays the one path enforce-proxy-child-creation reads to tell a WRAPPED
 * gateway export from a PASS-THROUGH one — no `_test_` barrel exists to read instead.
 *
 * USAGE:
 * gatewayBarrelPathTransformer({
 *   callerFilePath: '/repo/packages/mcp/src/brokers/x/x-broker.proxy.ts',
 *   gatewayFolder: 'node',
 *   subpath: 'fs__promises',
 * });
 * // Returns '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts' as branded FilePath
 */

const PACKAGES_SEGMENT = '/packages/';

export const gatewayBarrelPathTransformer = ({
  callerFilePath,
  gatewayFolder,
  subpath,
}: {
  callerFilePath: string;
  gatewayFolder: string;
  subpath: string;
}): string | null => {
  const packagesIndex = callerFilePath.indexOf(PACKAGES_SEGMENT);
  if (packagesIndex === -1) {
    return null;
  }

  const workspaceRoot = callerFilePath.slice(0, packagesIndex);
  return `${workspaceRoot}/packages/@gateway/${gatewayFolder}/src/${subpath}/${subpath}.ts`;
};
