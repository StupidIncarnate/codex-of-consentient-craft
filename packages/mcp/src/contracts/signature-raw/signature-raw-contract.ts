/**
 * PURPOSE: Defines a branded string type for raw function signature text
 *
 * USAGE:
 * const signature: SignatureRaw = signatureRawContract.parse('export const foo = (input: string): boolean =>');
 * // Returns a branded SignatureRaw string type
 */
import { z } from 'zod';

export const signatureRawContract = z.string().brand<'SignatureRaw'>();

export type SignatureRaw = z.infer<typeof signatureRawContract>;
