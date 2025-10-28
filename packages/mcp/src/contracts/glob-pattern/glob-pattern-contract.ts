import { z } from 'zod';

export const globPatternContract = z.string().brand<'GlobPattern'>();

export type GlobPattern = z.infer<typeof globPatternContract>;
