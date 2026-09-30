/**
 * PURPOSE: Defines the ImportEdge structure representing cross-package barrel import
 * relationships aggregated by (consumerPackage, sourcePackage, barrel) triple.
 *
 * USAGE:
 * importEdgeContract.parse({
 *   consumerPackage: 'web',
 *   sourcePackage: 'shared',
 *   barrel: 'contracts',
 *   importCount: 3,
 * });
 * // Returns validated ImportEdge
 *
 * WHEN-TO-USE: Building the import-edges section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import { z } from '#gateway/npm/zod';

export const importEdgeContract = z.object({
  consumerPackage: z.string().brand<'ImportEdgeConsumerPackage'>(),
  sourcePackage: z.string().brand<'ImportEdgeSourcePackage'>(),
  barrel: z.string().brand<'ImportEdgeBarrel'>(),
  importCount: z.number().int().min(1).brand<'ImportCount'>(),
});

export type ImportEdge = z.infer<typeof importEdgeContract>;
