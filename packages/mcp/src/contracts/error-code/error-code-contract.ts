/**
 * PURPOSE: Defines a branded integer type for JSON-RPC error codes
 *
 * USAGE:
 * const code: ErrorCode = errorCodeContract.parse(-32600);
 * // Returns a branded ErrorCode integer type
 */
import { z } from 'zod';

export const errorCodeContract = z.number().int().brand<'ErrorCode'>();

export type ErrorCode = z.infer<typeof errorCodeContract>;
