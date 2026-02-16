/**
 * PURPOSE: Zod union schema for all tool input types (Write, Edit, MultiEdit, Bash)
 *
 * USAGE:
 * const toolInput = toolInputContract.parse(input);
 * // Returns validated ToolInput (Write, Edit, MultiEdit, or Bash)
 */
import { z } from 'zod';
import { writeToolInputContract } from '../write-tool-input/write-tool-input-contract';
import { editToolInputContract } from '../edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../multi-edit-tool-input/multi-edit-tool-input-contract';
import { bashToolInputContract } from '../bash-tool-input/bash-tool-input-contract';

export const toolInputContract = z.union([
  writeToolInputContract,
  editToolInputContract,
  multiEditToolInputContract,
  bashToolInputContract,
]);

export type ToolInput = z.infer<typeof toolInputContract>;
