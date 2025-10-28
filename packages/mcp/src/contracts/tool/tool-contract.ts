import { z } from 'zod';

export const toolContract = z.object({
  name: z.string().brand<'ToolName'>(),
  description: z.string().brand<'ToolDescription'>(),
  inputSchema: z.unknown(),
});

export type Tool = z.infer<typeof toolContract>;
