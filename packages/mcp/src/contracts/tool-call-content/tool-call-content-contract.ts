import { z } from 'zod';

export const toolCallContentContract = z.object({
  type: z.string().brand<'ContentType'>(),
  text: z.string().brand<'ContentText'>(),
});

export type ToolCallContent = z.infer<typeof toolCallContentContract>;
