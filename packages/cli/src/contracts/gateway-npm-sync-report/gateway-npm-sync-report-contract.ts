/**
 * PURPOSE: What one npm-gateway sync did — or, under `npm ci`, would have done: the gateway folders
 * copied from dungeonmaster's own npm gateway, the folders generated as passthroughs, the packages
 * whose passthrough found no type declarations, and the ESM-only packages whose passthrough carries
 * types only. A caller prints it; nothing parses it back.
 *
 * USAGE:
 * gatewayNpmSyncReportContract.parse({ copied: ['zod'], generated: ['left-pad', 'ink'], untyped: [], esmOnly: ['ink'] });
 * // Returns a GatewayNpmSyncReport
 */

import { z } from '#gateway/npm/zod';
import { gatewayNpmDependencyContract } from '../gateway-npm-dependency/gateway-npm-dependency-contract';

export const gatewayNpmSyncReportContract = z
  .object({
    copied: z.array(gatewayNpmDependencyContract.shape.folder),
    generated: z.array(gatewayNpmDependencyContract.shape.folder),
    untyped: z.array(gatewayNpmDependencyContract.shape.name),
    esmOnly: z.array(gatewayNpmDependencyContract.shape.name),
  })
  .brand<'GatewayNpmSyncReport'>();

export type GatewayNpmSyncReport = z.infer<typeof gatewayNpmSyncReportContract>;
