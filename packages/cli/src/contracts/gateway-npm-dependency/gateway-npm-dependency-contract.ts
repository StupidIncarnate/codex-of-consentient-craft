/**
 * PURPOSE: One third-party package a consumer declares, paired with the folder its
 * `#gateway/npm/<folder>` wrapper lives in. `range` is the version range of the FIRST declaration
 * the sync met, which is what the npm gateway's own package.json records for it. `location` indicates
 * whether the dependency was declared in `dependencies` or `devDependencies`.
 *
 * USAGE:
 * gatewayNpmDependencyContract.parse({ name: '@hono/node-server', range: '^1.0.0', folder: 'hono__node-server', location: 'dependencies' });
 * // Returns a GatewayNpmDependency
 */

import { z } from '#gateway/npm/zod';

export const gatewayNpmDependencyContract = z
  .object({
    name: z.string().min(1).brand<'GatewayNpmDependencyName'>(),
    range: z.string().brand<'GatewayNpmDependencyRange'>(),
    folder: z.string().min(1).brand<'GatewayNpmDependencyFolder'>(),
    location: z.enum(['dependencies', 'devDependencies']).default('dependencies'),
  })
  .brand<'GatewayNpmDependency'>();

export type GatewayNpmDependency = z.infer<typeof gatewayNpmDependencyContract>;
