/**
 * PURPOSE: Builds the four-entry `imports` map every workspace package needs to resolve
 * `#gateway/<folder>/*` specifiers to this repo's own gateway packages — the same shape
 * `packageScaffoldConfigStatics.gatewayImports` substitutes for `dungeonmaster create-package`,
 * reused here so `dungeonmaster init` writes identical entries into EXISTING packages.
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
