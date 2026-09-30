/**
 * PURPOSE: The one real runtime check for a `Error` value, branded `'#GatewayError'` so every contract that holds one shares this check (BR C9)
 *
 * USAGE:
 * errorSchema.parse(new Error('sample'));
 * // Returns the same value, typed as Error & branded '#GatewayError'
 */
import { z } from 'zod';

export const errorSchema = z.instanceof(Error).brand<'#GatewayError'>();
