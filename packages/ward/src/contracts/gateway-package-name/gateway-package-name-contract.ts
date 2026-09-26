/**
 * PURPOSE: The `name` field of one gateway package's own `package.json` (`@dungeonmaster/node`,
 * `@dungeonmaster/bin`, `@dungeonmaster/browser`) — read off disk, never hardcoded, so a repo with
 * a different scope still gets checked correctly. Standalone so `gatewayPackageNamesContract` and
 * `platformCrossingViolationContract` share the exact same brand instead of two independent
 * `.brand<'GatewayPackageName'>()` calls drifting apart.
 *
 * USAGE:
 * gatewayPackageNameContract.parse('@dungeonmaster/node');
 * // Returns branded GatewayPackageName
 */

import { z } from 'zod';

export const gatewayPackageNameContract = z.string().min(1).brand<'GatewayPackageName'>();

export type GatewayPackageName = z.infer<typeof gatewayPackageNameContract>;
