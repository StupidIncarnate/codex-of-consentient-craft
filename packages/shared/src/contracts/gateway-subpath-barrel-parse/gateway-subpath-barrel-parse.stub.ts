/**
 * PURPOSE: Builds a valid GatewaySubpathBarrelParse for tests
 *
 * USAGE:
 * GatewaySubpathBarrelParseStub();
 * // Returns a valid GatewaySubpathBarrelParse
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { gatewaySubpathBarrelParseContract } from './gateway-subpath-barrel-parse-contract';
import type { GatewaySubpathBarrelParse } from './gateway-subpath-barrel-parse-contract';

export const GatewaySubpathBarrelParseStub = ({
  ...props
}: StubArgument<GatewaySubpathBarrelParse> = {}): GatewaySubpathBarrelParse =>
  gatewaySubpathBarrelParseContract.parse({ wrapperNames: [], ...props });
