import { z } from 'zod';

export const toolDescriptionContract = z.string().brand<'ToolDescription'>();

export type ToolDescription = z.infer<typeof toolDescriptionContract>;
