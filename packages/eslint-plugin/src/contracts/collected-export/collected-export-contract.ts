/**
 * PURPOSE: Defines the shape of a collected export from AST traversal
 *
 * USAGE:
 * import type { CollectedExport } from '../contracts/collected-export/collected-export-contract';
 * const exports: CollectedExport[] = [];
 * // Used by collect-exports-layer-broker and validate-export-layer-broker
 */
import { z } from 'zod';
import { identifierContract } from '@dungeonmaster/shared/contracts';

export const collectedExportContract = z.object({
  type: z.string().brand<'TsestreeNodeType'>(),
  name: identifierContract.optional(),
  isTypeOnly: z.boolean(),
});

export type CollectedExport = z.infer<typeof collectedExportContract>;
