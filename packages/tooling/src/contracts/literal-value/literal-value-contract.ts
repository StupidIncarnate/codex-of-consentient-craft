import { z } from 'zod';

export const literalValueContract = z.string().brand<'LiteralValue'>();

export type LiteralValue = z.infer<typeof literalValueContract>;
