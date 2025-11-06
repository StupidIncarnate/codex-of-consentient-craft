/**
 * PURPOSE: Zod schema for tool response with passthrough for additional fields
 *
 * USAGE:
 * const response = toolResponseContract.parse(responseData);
 * // Returns validated ToolResponse with optional filePath and success, allows extra fields
 */
import { z } from 'zod';

export const toolResponseContract = z
  .object({
    filePath: z.string().brand<'ToolResponseFilePath'>().optional(),
    success: z.boolean().optional(),
    // Additional fields depend on the specific tool
  })
  .passthrough();

export type ToolResponse = z.infer<typeof toolResponseContract>;
