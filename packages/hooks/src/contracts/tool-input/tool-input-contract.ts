/**
 * PURPOSE: Zod union schema for all tool input types (Write, Edit, MultiEdit)
 *
 * USAGE:
 * const toolInput = toolInputContract.parse(input);
 * // Returns validated ToolInput (Write, Edit, or MultiEdit)
 */
import { z } from 'zod';
import { writeToolInputContract } from '../write-tool-input/write-tool-input-contract';
import { editToolInputContract } from '../edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../multi-edit-tool-input/multi-edit-tool-input-contract';

export const toolInputContract = z.union([
  writeToolInputContract,
  editToolInputContract,
  multiEditToolInputContract,
]);

export type ToolInput = z.infer<typeof toolInputContract>;
