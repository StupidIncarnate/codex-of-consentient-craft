/**
 * PURPOSE: Builds a valid GatewayBarrelExportedNames for tests
 *
 * USAGE:
 * GatewayBarrelExportedNamesStub();
 * // Returns a valid GatewayBarrelExportedNames
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { gatewayBarrelExportedNamesContract } from './gateway-barrel-exported-names-contract';
import type { GatewayBarrelExportedNames } from './gateway-barrel-exported-names-contract';

export const GatewayBarrelExportedNamesStub = ({
  ...props
}: StubArgument<GatewayBarrelExportedNames> = {}): GatewayBarrelExportedNames =>
  gatewayBarrelExportedNamesContract.parse({ directNames: [], reexportTargets: [], ...props });
