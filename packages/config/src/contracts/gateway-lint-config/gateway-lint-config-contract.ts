/**
 * PURPOSE: Validates the `gateway` key of `.dungeonmaster.json` — the mechanism this epic uses to ban
 * or restrict a gateway export as bugs arise, without hard-coding the ban into the gateway's own
 * source. Split out of `dungeonmasterConfigContract` (rather than inlined under its `gateway` key) so
 * eslint-plugin's three gateway lint rules can parse this ONE shape directly as a rule OPTION —
 * `configDungeonmasterBroker` reads `.dungeonmaster.json` once when ESLint's flat config loads and
 * passes the parsed value to every rule, so no rule reads a file itself for this shape.
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
