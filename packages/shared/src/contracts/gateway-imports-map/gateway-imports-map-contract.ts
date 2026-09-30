/**
 * PURPOSE: Validates a package.json `imports` map — the specifiers a workspace package resolves
 * through its own `package.json`, never through `node_modules`. Every gateway-touching package.json
 * this install step reads or writes goes through this shape.
 *
 * USAGE:
 * const imports = gatewayImportsMapContract.parse({'#gateway/npm/*': '@acme/npm/*'});
 * // Returns validated GatewayImportsMap with plain string keys and branded values
 */

import { z } from '#gateway/npm/zod';

export const gatewayImportsMapContract = z.record(
  z.string(),
  z.string().brand<'GatewayImportsMapValue'>(),
);

export type GatewayImportsMap = z.infer<typeof gatewayImportsMapContract>;
