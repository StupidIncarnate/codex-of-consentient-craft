/**
 * PURPOSE: Builds the four-entry `imports` map every workspace package needs to resolve
 * `#gateway/<folder>/*` specifiers to this repo's own gateway packages, one entry per
 * `gatewayFoldersStatics.folders` name. `dungeonmaster create-package` calls this directly (via
 * `packageScaffoldFilesTransformer`) for a brand-new package, and `dungeonmaster init` calls it
 * through `gatewayImportsMergeTransformer` to wire an EXISTING package and through
 * `gatewayPackageScaffoldFilesTransformer` to scaffold the gateway packages themselves — one
 * implementation, so every workspace package's `imports` field is built the same way.
 *
 * USAGE:
 * gatewayImportsFieldTransformer({ scope: PathSegmentStub({value: '@acme'}) });
 * // Returns {'#gateway/npm/*': '@acme/npm/*', '#gateway/node/*': '@acme/node/*', ...}
 */

import type { PathSegment } from '@dungeonmaster/shared/contracts';
import {
  gatewayImportsMapContract,
  type GatewayImportsMap,
} from '../../contracts/gateway-imports-map/gateway-imports-map-contract';
import { gatewayFoldersStatics } from '../../statics/gateway-folders/gateway-folders-statics';

export const gatewayImportsFieldTransformer = ({
  scope,
}: {
  scope: PathSegment;
}): GatewayImportsMap =>
  gatewayImportsMapContract.parse(
    Object.fromEntries(
      gatewayFoldersStatics.folders.map((folder) => [
        `#gateway/${folder}/*`,
        `${String(scope)}/${folder}/*`,
      ]),
    ),
  );
