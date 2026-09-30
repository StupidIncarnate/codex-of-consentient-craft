/**
 * PURPOSE: Zod schema for tool response with passthrough for additional fields
 *
 * USAGE:
 * const response = toolResponseContract.parse(responseData);
 * // Returns validated ToolResponse with optional filePath and success, allows extra fields
 */
import { z } from '#gateway/npm/zod';

export const toolResponseContract = z
  .object({
    filePath: z.string().brand<'HookToolResponseFilePath'>().optional(),
    success: z.boolean().optional(),
    // Additional fields depend on the specific tool
  })
  .loose()
  .brand<'HookToolResponse'>();

export type ToolResponse = z.infer<typeof toolResponseContract>;
