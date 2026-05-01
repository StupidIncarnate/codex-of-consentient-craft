/**
 * PURPOSE: Defines the DirectCallEdge structure linking a caller package to a callee package
 * through adapter files in `packages/<caller>/src/adapters/<callee>/` subfolders, along
 * with the method names extracted from those adapter files.
 *
 * USAGE:
 * directCallEdgeContract.parse({
 *   callerPackage: 'server',
 *   calleePackage: 'orchestrator',
 *   adapterFiles: ['/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts'],
 *   methodNames: ['getQuest'],
 * });
 * // Returns validated DirectCallEdge
 *
 * WHEN-TO-USE: Building the direct-call-edges section of the project-map EDGES footer
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const directCallEdgeContract = z.object({
  callerPackage: contentTextContract,
  calleePackage: contentTextContract,
  adapterFiles: z.array(absoluteFilePathContract),
  methodNames: z.array(contentTextContract),
});

export type DirectCallEdge = z.infer<typeof directCallEdgeContract>;
