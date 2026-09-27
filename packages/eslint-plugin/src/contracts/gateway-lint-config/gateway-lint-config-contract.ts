/**
 * PURPOSE: Validates the `gateway` key of `.dungeonmaster.json` for THIS package's own rule brokers.
 * A local copy of `@dungeonmaster/config`'s identically-shaped `gatewayLintConfigContract`,
 * deliberately: `eslint.config.js` loads this package's rules from TypeScript source with `tsx/cjs`,
 * which sets no `source` export condition, so a cross-package import here would resolve
 * `@dungeonmaster/config`'s BUILT `dist/contracts.js` — stale the moment this file's own shape
 * changes, and this package's rules load on every lint run repo-wide, so a stale cross-package read
 * here breaks lint for everyone until someone rebuilds `@dungeonmaster/config`. A relative import
 * inside this package never has that problem, because tsx already reads THIS package from source.
 *
 * USAGE:
 * gatewayLintConfigContract.parse({
 *   bannedExports: [
 *     {subpath: '#gateway/node/fs', name: 'readFileSync', use: 'readFile', reason: 'blocks the loop'},
 *   ],
 *   restrictedTo: [
 *     {subpath: '#gateway/bin/spawn', packages: ['@dungeonmaster/orchestrator'], reason: 'only orchestrator spawns'},
 *   ],
 * });
 * // Returns the validated GatewayLintConfig
 */

import { z } from 'zod';

export const gatewayLintConfigContract = z.object({
  bannedExports: z
    .array(
      z.object({
        // Written in FULL — the exact `#gateway/...` text a caller's own import uses.
        subpath: z.string().min(1).brand<'GatewaySubpath'>(),
        name: z.string().min(1).brand<'GatewayExportName'>(),
        use: z.string().min(1).brand<'GatewayExportName'>(),
        reason: z.string().min(1).brand<'GatewayBanReason'>(),
      }),
    )
    .optional(),
  restrictedTo: z
    .array(
      z.object({
        subpath: z.string().min(1).brand<'GatewaySubpath'>(),
        // Omitted means the whole subpath is restricted; set means only this one export is.
        name: z.string().min(1).brand<'GatewayExportName'>().optional(),
        // Whole workspace packages (`packages/*`), never a folder inside one.
        packages: z.array(z.string().brand<'PackageName'>()).min(1),
        reason: z.string().min(1).brand<'GatewayRestrictReason'>(),
      }),
    )
    .optional(),
});

export type GatewayLintConfig = z.infer<typeof gatewayLintConfigContract>;
