import { z } from 'zod';

export const toolNameContract = z.string().brand<'ToolName'>();

export type ToolName = z.infer<typeof toolNameContract>;
