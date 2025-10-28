import { z } from 'zod';

export const signatureRawContract = z.string().brand<'SignatureRaw'>();

export type SignatureRaw = z.infer<typeof signatureRawContract>;
