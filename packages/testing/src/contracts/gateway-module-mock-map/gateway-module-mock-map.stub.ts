/**
 * PURPOSE: Builds a valid GatewayModuleMockMap for tests, defaulting to the elkjs mock's two
 * specifiers.
 *
 * USAGE:
 * GatewayModuleMockMapStub({ glob: '/repo/packages/@gateway/npm/src/glob/glob.jest-mock.cjs' });
 * // Returns a GatewayModuleMockMap holding the elkjs entries plus the one given
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { gatewayModuleMockMapContract } from './gateway-module-mock-map-contract';
import type { GatewayModuleMockMap } from './gateway-module-mock-map-contract';

export const GatewayModuleMockMapStub = ({
  ...props
}: StubArgument<GatewayModuleMockMap> = {}): GatewayModuleMockMap =>
  gatewayModuleMockMapContract.parse({
    '#gateway/npm/elkjs': '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
    elkjs: '/repo/packages/@gateway/npm/src/elkjs/elkjs.jest-mock.cjs',
    ...props,
  });
