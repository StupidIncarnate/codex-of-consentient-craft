/**
 * PURPOSE: Create stub GatewayImportsMap instances for testing
 *
 * USAGE:
 * const imports = GatewayImportsMapStub({'#gateway/npm/*': '@acme/npm/*'});
 * // Returns valid GatewayImportsMap instance
 */

import type { StubArgument } from '../../@types/stub-argument.type';
import { gatewayImportsMapContract } from './gateway-imports-map-contract';
import type { GatewayImportsMap } from './gateway-imports-map-contract';

export const GatewayImportsMapStub = ({
  ...props
}: StubArgument<GatewayImportsMap> = {}): GatewayImportsMap =>
  gatewayImportsMapContract.parse({
    '#gateway/npm/*': '@dungeonmaster/npm/*',
    '#gateway/node/*': '@dungeonmaster/node/*',
    '#gateway/browser/*': '@dungeonmaster/browser/*',
    '#gateway/bin/*': '@dungeonmaster/bin/*',
    ...props,
  });
