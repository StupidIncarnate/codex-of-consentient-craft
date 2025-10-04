import { z } from 'zod';

export const toolResponseContract = z
  .object({
    filePath: z.string().optional(),
    success: z.boolean().optional(),
    // Additional fields depend on the specific tool
  })
  .passthrough();

export type ToolResponse = z.infer<typeof toolResponseContract>;
