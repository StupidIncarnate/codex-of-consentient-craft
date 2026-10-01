/**
 * PURPOSE: Why the npm-gateway sync wrote a passthrough for a package dungeonmaster has its own
 * wrapper for — `version` when the installed version is outside the range dungeonmaster's own npm
 * gateway declares (or either side is missing), `compile` when the copied wrapper does not compile
 * against what the consumer installed, `esm-only` when the CommonJS gateway cannot `require` a
 * package the wrapper imports, `unresolved-import` when the wrapper imports something the consumer
 * will not have.
 *
 * USAGE:
 * gatewayNpmSkipReasonContract.parse('version');
 * // Returns 'version' as GatewayNpmSkipReason
 */

import { z } from '#gateway/npm/zod';

export const gatewayNpmSkipReasonContract = z.enum([
  'version',
  'compile',
  'esm-only',
  'unresolved-import',
]);

export type GatewayNpmSkipReason = z.infer<typeof gatewayNpmSkipReasonContract>;
