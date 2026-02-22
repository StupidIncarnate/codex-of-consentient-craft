/**
 * PURPOSE: Creates test data for tree-formatted output strings
 *
 * USAGE:
 * const output = TreeOutputStub({ value: 'guards/\n  has-permission-guard (guard)' });
 * // Returns branded TreeOutput string
 */
import { treeOutputContract } from './tree-output-contract';
import type { TreeOutput } from './tree-output-contract';

export const TreeOutputStub = (
  { value }: { value: string } = { value: 'guards/\n  example-guard (guard)' },
): TreeOutput => treeOutputContract.parse(value);
