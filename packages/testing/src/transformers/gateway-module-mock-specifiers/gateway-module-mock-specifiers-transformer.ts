/**
 * PURPOSE: The specifiers one npm gateway mock answers — `#gateway/npm/<folder>` and the raw package
 * name — each mapped to the mock file. Both are needed: code outside the gateway imports the gateway
 * name, and the gateway's own wrapper files import the raw name. Answering only the raw name is not
 * enough: the barrel's `export *` copies only the keys a mock lists, and a mock that answers names
 * on demand (the tabler icons mock answers any `Icon*`) lists none.
 *
 * USAGE:
 * gatewayModuleMockSpecifiersTransformer({ folder: 'tabler__icons-react', packageName: '@tabler/icons-react', mockPath: '/repo/.../tabler__icons-react.jest-mock.cjs' });
 * // Returns { '#gateway/npm/tabler__icons-react': '/repo/...', '@tabler/icons-react': '/repo/...' }
 */

import { gatewayModuleMockMapContract } from '../../contracts/gateway-module-mock-map/gateway-module-mock-map-contract';
import type { GatewayModuleMockMap } from '../../contracts/gateway-module-mock-map/gateway-module-mock-map-contract';
import { gatewayModuleMockStatics } from '../../statics/gateway-module-mock/gateway-module-mock-statics';

export const gatewayModuleMockSpecifiersTransformer = ({
  folder,
  packageName,
  mockPath,
}: {
  folder: string;
  packageName: string | null;
  mockPath: string;
}): GatewayModuleMockMap =>
  gatewayModuleMockMapContract.parse({
    [`${gatewayModuleMockStatics.specifiers.npmGatewayPrefix}${folder}`]: mockPath,
    ...(packageName === null ? {} : { [packageName]: mockPath }),
  });
