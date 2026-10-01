/**
 * PURPOSE: What one npm-gateway sync did — or, under `npm ci`, would have done: the gateway folders
 * copied from dungeonmaster's own npm gateway, the folders generated as passthroughs, the packages
 * whose passthrough found no type declarations, the ESM-only packages whose passthrough carries
 * types only, the packages that got a passthrough although dungeonmaster has its own wrapper for
 * them (and why), the installed packages that got nothing because neither their root nor any
 * subpath we wrap resolves, and — only when the closing `npm install` that refreshes the lockfile failed —
 * the warning saying so. A caller prints it; nothing parses it back.
 *
 * USAGE:
 * gatewayNpmSyncReportContract.parse({ copied: ['elkjs'], generated: ['zod'], untyped: [], esmOnly: [], skippedOwnCopy: [{ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }] });
 * // Returns a GatewayNpmSyncReport
 */

import { z } from '#gateway/npm/zod';
import { gatewayNpmDependencyContract } from '../gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSkippedOwnCopyContract } from '../gateway-npm-skipped-own-copy/gateway-npm-skipped-own-copy-contract';

export const gatewayNpmSyncReportContract = z
  .object({
    copied: z.array(gatewayNpmDependencyContract.shape.folder),
    generated: z.array(gatewayNpmDependencyContract.shape.folder),
    untyped: z.array(gatewayNpmDependencyContract.shape.name),
    esmOnly: z.array(gatewayNpmDependencyContract.shape.name),
    skippedOwnCopy: z.array(gatewayNpmSkippedOwnCopyContract),
    noRootExport: z.array(gatewayNpmDependencyContract.shape.name),
    lockfileWarning: z.string().min(1).brand<'GatewayNpmSyncReportLockfileWarning'>().optional(),
  })
  .brand<'GatewayNpmSyncReport'>();

export type GatewayNpmSyncReport = z.infer<typeof gatewayNpmSyncReportContract>;
