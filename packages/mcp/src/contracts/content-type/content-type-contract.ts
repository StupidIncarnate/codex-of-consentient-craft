import { z } from 'zod';

export const contentTypeContract = z.string().brand<'ContentType'>();

export type ContentType = z.infer<typeof contentTypeContract>;
