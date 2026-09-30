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

import { z } from '#gateway/npm/zod';
import { platformContract } from '../platform/platform-contract';

export const platformCrossingViolationContract = z.object({
  packageName: z.string().min(1).brand<'PlatformCrossingViolationPackageName'>(),
  platform: platformContract,
  chain: z.array(z.string().min(1).brand<'PlatformCrossingViolationChain'>()).min(1),
  crossedGatewayPackage: z.string().min(1).brand<'PlatformCrossingViolationCrossedGatewayPackage'>(),
}).brand<'PlatformCrossingViolation'>();

export type PlatformCrossingViolation = z.infer<typeof platformCrossingViolationContract>;
