/**
 * PURPOSE: Builds the four-entry `imports` map every workspace package needs to resolve
 * `#gateway/<folder>/*` specifiers to a repo's own gateway packages, one entry per
 * `gatewayLocationsStatics.folders` name — the ONE builder every scaffolder that writes a
 * package.json `imports` field calls, so a package can declare this field itself the moment it is
 * scaffolded rather than waiting for a LATER install step to scan for it on disk. `cli`'s
 * `create-package` and its `init` gateway step both call this directly; `siegelense`'s
 * `hydration-recipes` scaffold calls it too, because the gateway step of `init` runs once, before
 * `hydration-recipes` exists to be scanned.
 *
 * USAGE:
 * gatewayImportsFieldTransformer({ scope: PathSegmentStub({value: '@acme'}) });
 * // Returns {'#gateway/npm/*': '@acme/npm/*', '#gateway/node/*': '@acme/node/*', ...}
 */

import {
  gatewayImportsMapContract,
  type GatewayImportsMap,
} from '../../contracts/gateway-imports-map/gateway-imports-map-contract';
import { gatewayLocationsStatics } from '../../statics/gateway-locations/gateway-locations-statics';

export const gatewayImportsFieldTransformer = ({ scope }: { scope: string }): GatewayImportsMap =>
  gatewayImportsMapContract.parse(
    Object.fromEntries(
      Object.values(gatewayLocationsStatics.folders).map((folder) => [
        `${gatewayLocationsStatics.importPrefix}/${folder}/*`,
        `${scope}/${folder}/*`,
      ]),
    ),
  );
