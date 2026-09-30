/**
 * PURPOSE: Validates a package.json `imports` map — the specifiers a workspace package resolves
 * through its own `package.json`, never through `node_modules`. Every gateway-touching package.json
 * this install step reads or writes goes through this shape.
 *
 * USAGE:
 * const imports = gatewayImportsMapContract.parse({'#gateway/npm/*': '@acme/npm/*'});
 * // Returns validated GatewayImportsMap; a top-level record's keys and values are not fields, so stay plain
 */

import { z } from '#gateway/npm/zod';

export const gatewayImportsMapContract = z.record(z.string(), z.string());

export type GatewayImportsMap = z.infer<typeof gatewayImportsMapContract>;
