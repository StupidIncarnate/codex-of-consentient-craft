/**
 * PURPOSE: The three gateway package names the platform-crossing walk treats as forbidden imports
 * for the OTHER platform — read once per run from `packages/node`, `packages/bin` and
 * `packages/browser`'s own `package.json` `name` field, never hardcoded, so a repo whose scope is
 * not `@dungeonmaster` still gets checked correctly. A field is absent when that gateway package
 * does not exist yet in the repo being checked.
 *
 * USAGE:
 * gatewayPackageNamesContract.parse({node: '@dungeonmaster/node', bin: '@dungeonmaster/bin', browser: '@dungeonmaster/browser'});
 * // Returns: GatewayPackageNames
 */

import { z } from 'zod';
import { gatewayPackageNameContract } from '../gateway-package-name/gateway-package-name-contract';

export const gatewayPackageNamesContract = z.object({
  node: gatewayPackageNameContract.optional(),
  bin: gatewayPackageNameContract.optional(),
  browser: gatewayPackageNameContract.optional(),
});

export type GatewayPackageNames = z.infer<typeof gatewayPackageNamesContract>;
