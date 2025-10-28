import { z } from 'zod';

export const resultCountContract = z.number().int().nonnegative().brand<'ResultCount'>();

export type ResultCount = z.infer<typeof resultCountContract>;
