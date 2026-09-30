/**
 * PURPOSE: The three gateway package names the platform-crossing walk treats as forbidden imports
 * for the OTHER platform — read once per run from `packages/@gateway/node`, `packages/@gateway/bin`
 * and `packages/@gateway/browser`'s own `package.json` `name` field, never hardcoded, so a repo whose
 * scope is not `@dungeonmaster` still gets checked correctly. A field is absent when that gateway
 * package does not exist yet in the repo being checked.
 *
 * USAGE:
 * gatewayPackageNamesContract.parse({node: '@dungeonmaster/node', bin: '@dungeonmaster/bin', browser: '@dungeonmaster/browser'});
 * // Returns: GatewayPackageNames
 */

import { z } from '#gateway/npm/zod';

export const gatewayPackageNamesContract = z.object({
  node: z.string().min(1).brand<'GatewayPackageNamesNode'>().optional(),
  bin: z.string().min(1).brand<'GatewayPackageNamesBin'>().optional(),
  browser: z.string().min(1).brand<'GatewayPackageNamesBrowser'>().optional(),
}).brand<'GatewayPackageNames'>();

export type GatewayPackageNames = z.infer<typeof gatewayPackageNamesContract>;
