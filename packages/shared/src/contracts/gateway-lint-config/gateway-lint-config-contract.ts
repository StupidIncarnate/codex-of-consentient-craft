/**
 * PURPOSE: Validates the `gateway` key of `.dungeonmaster.json` — the mechanism this epic uses to ban
 * or restrict a gateway export as bugs arise, without hard-coding the ban into the gateway's own
 * source. Lives here, not in `config` or `eslint-plugin`, because `eslint.config.js` loads
 * eslint-plugin's rule brokers from TypeScript source but resolves a cross-package import through
 * that OTHER package's BUILT `dist` — a `config`-only copy goes stale on every lint run until someone
 * rebuilds `config`. Both `config` and `eslint-plugin` already depend on `@dungeonmaster/shared`, so
 * this one copy is what `dungeonmasterConfigContract` and the three gateway lint rules parse
 * identically, never two hand-kept shapes.
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
