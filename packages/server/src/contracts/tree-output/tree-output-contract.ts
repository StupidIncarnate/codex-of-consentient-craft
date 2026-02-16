/**
 * PURPOSE: Defines branded string type for tree-formatted output text
 *
 * USAGE:
 * const output = treeOutputContract.parse('guards/\n  has-permission-guard (guard)');
 * // Returns branded TreeOutput string
 */
import { z } from 'zod';

export const treeOutputContract = z.string().brand<'TreeOutput'>();

export type TreeOutput = z.infer<typeof treeOutputContract>;
