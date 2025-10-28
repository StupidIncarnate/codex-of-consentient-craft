import { z } from 'zod';

export const contentTextContract = z.string().brand<'ContentText'>();

export type ContentText = z.infer<typeof contentTextContract>;
