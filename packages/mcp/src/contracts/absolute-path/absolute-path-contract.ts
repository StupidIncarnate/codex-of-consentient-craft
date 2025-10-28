import { z } from 'zod';

export const absolutePathContract = z.string().brand<'AbsolutePath'>();

export type AbsolutePath = z.infer<typeof absolutePathContract>;
