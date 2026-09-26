/**
 * PURPOSE: One reachable import chain from a browser-platform (or node-platform) package's own
 * file down to an import of the other platform's gateway. `chain` names every hop as the literal
 * specifier that carried the walk across it, ending with the forbidden gateway import itself, so
 * `platformCrossingViolationDisplayTransformer` never has to re-derive what happened — every step
 * is already the exact text a reader would grep for.
 *
 * USAGE:
 * platformCrossingViolationContract.parse({
 *   packageName: 'web',
 *   platform: 'browser',
 *   chain: ['@dungeonmaster/shared/brokers', './cwd-resolve/cwd-resolve-broker', '@dungeonmaster/node/fs'],
 * });
 * // Returns: PlatformCrossingViolation
 */

import { z } from 'zod';
import { platformContract } from '../platform/platform-contract';
import { platformCrossingChainHopContract } from '../platform-crossing-chain-hop/platform-crossing-chain-hop-contract';
import { gatewayPackageNameContract } from '../gateway-package-name/gateway-package-name-contract';

export const platformCrossingViolationContract = z.object({
  packageName: z.string().min(1).brand<'PlatformCrossingPackageName'>(),
  platform: platformContract,
  chain: z.array(platformCrossingChainHopContract).min(1),
  crossedGatewayPackage: gatewayPackageNameContract,
});

export type PlatformCrossingViolation = z.infer<typeof platformCrossingViolationContract>;
