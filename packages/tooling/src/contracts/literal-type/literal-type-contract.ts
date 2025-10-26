import { z } from 'zod';

export const literalTypeContract = z.enum(['string', 'regex']).brand<'LiteralType'>();

export type LiteralType = z.infer<typeof literalTypeContract>;
