import { z } from 'zod';

const toolCallContentContract = z.object({
  type: z.string().brand<'ContentType'>(),
  text: z.string().brand<'ContentText'>(),
});

export const toolCallResultContract = z.object({
  content: z.array(toolCallContentContract),
});

export type ToolCallResult = z.infer<typeof toolCallResultContract>;
