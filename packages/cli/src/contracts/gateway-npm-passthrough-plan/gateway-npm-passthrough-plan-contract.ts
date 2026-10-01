/**
 * PURPOSE: One passthrough the npm-gateway sync will write — the dependency it re-exports (its
 * `name` is the specifier the barrel imports, a package or one of its subpaths, and its `folder` is
 * where the barrel lands) and the barrel shape that package's declarations call for. An
 * `export-equals` plan also carries `exportNames`, the names its barrel re-exports one by one; no
 * other shape has it. Reach for `gatewayNpmDependencyContract` for what the consumer declared; this
 * is what gets written for it.
 *
 * USAGE:
 * gatewayNpmPassthroughPlanContract.parse({ dependency: { name: 'hono/ws', range: '^4.0.0', folder: 'hono__ws' }, shape: 'named' });
 * // Returns a GatewayNpmPassthroughPlan
 */

import { z } from '#gateway/npm/zod';
import { gatewayNpmDependencyContract } from '../gateway-npm-dependency/gateway-npm-dependency-contract';
import { npmModuleExportNamesContract } from '../npm-module-export-names/npm-module-export-names-contract';
import { npmModuleExportShapeContract } from '../npm-module-export-shape/npm-module-export-shape-contract';

export const gatewayNpmPassthroughPlanContract = z
  .object({
    dependency: gatewayNpmDependencyContract,
    shape: npmModuleExportShapeContract,
    exportNames: npmModuleExportNamesContract.optional(),
  })
  .brand<'GatewayNpmPassthroughPlan'>();

export type GatewayNpmPassthroughPlan = z.infer<typeof gatewayNpmPassthroughPlanContract>;
