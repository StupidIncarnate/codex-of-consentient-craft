/**
 * PURPOSE: Tells whether an import specifier names one of dungeonmaster's own published packages
 * (`@dungeonmaster/shared/contracts`, `@dungeonmaster/testing/register-mock`, ...) as opposed to its
 * gateway packages. The toolkit is first-party in every repo that runs the rules: the jest
 * transformers that hoist `registerMock` recognise it by that exact specifier, so a consumer cannot
 * wrap it, and a consumer's generated code imports its contracts directly. The four gateway
 * packages stay refused — `@dungeonmaster/node/fs` is dungeonmaster's own gateway, never a
 * consumer's, and a consumer's code reaches its OWN copy through `#gateway/...`.
 *
 * USAGE:
 * isDungeonmasterToolkitImportGuard({ importSource: '@dungeonmaster/shared/contracts' });
 * // Returns true
 * isDungeonmasterToolkitImportGuard({ importSource: '@dungeonmaster/node/fs' });
 * // Returns false
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

const TOOLKIT_SCOPE = '@dungeonmaster';

export const isDungeonmasterToolkitImportGuard = ({
  importSource,
}: {
  importSource?: string;
}): boolean => {
  if (!importSource?.startsWith(`${TOOLKIT_SCOPE}/`)) {
    return false;
  }

  return !Object.values(gatewayLocationsStatics.folders).some(
    (folder) =>
      importSource === `${TOOLKIT_SCOPE}/${folder}` ||
      importSource.startsWith(`${TOOLKIT_SCOPE}/${folder}/`),
  );
};
