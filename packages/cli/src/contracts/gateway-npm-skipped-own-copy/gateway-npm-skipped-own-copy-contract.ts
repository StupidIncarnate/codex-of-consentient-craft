/**
 * PURPOSE: One package the npm-gateway sync wrote a passthrough for although dungeonmaster has its
 * own wrapper for it, and why. `installed` is the version the consumer has installed and `ours` the
 * range dungeonmaster's own npm gateway declares, each present only when it was found — a report
 * line names both so the person reading it sees the mismatch without opening a package.json.
 *
 * USAGE:
 * gatewayNpmSkippedOwnCopyContract.parse({ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' });
 * // Returns a GatewayNpmSkippedOwnCopy
 */

import { z } from '#gateway/npm/zod';
import { gatewayNpmDependencyContract } from '../gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSkipReasonContract } from '../gateway-npm-skip-reason/gateway-npm-skip-reason-contract';

export const gatewayNpmSkippedOwnCopyContract = z
  .object({
    name: gatewayNpmDependencyContract.shape.name,
    reason: gatewayNpmSkipReasonContract,
    installed: z.string().min(1).brand<'GatewayNpmSkippedOwnCopyInstalled'>().optional(),
    ours: z.string().min(1).brand<'GatewayNpmSkippedOwnCopyOurs'>().optional(),
  })
  .brand<'GatewayNpmSkippedOwnCopy'>();

export type GatewayNpmSkippedOwnCopy = z.infer<typeof gatewayNpmSkippedOwnCopyContract>;
