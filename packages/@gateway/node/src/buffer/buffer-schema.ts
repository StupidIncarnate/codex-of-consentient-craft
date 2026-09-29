/**
 * PURPOSE: The one real runtime check for a `Buffer` value, branded `'#GatewayBuffer'` so every
 * contract that holds one (an `execSync` failure's `stdout`/`stderr`) shares this exact check (BR
 * C9). `z.instanceof` is the right shape for a class — it rejects a string or a plain
 * `Uint8Array`-shaped object a bare `z.custom<Buffer>()` would silently accept.
 *
 * USAGE:
 * bufferSchema.parse(Buffer.from('output'));
 * // Returns the same Buffer instance, typed as Buffer & branded '#GatewayBuffer'
 */
import { z } from 'zod';
import { Buffer } from 'buffer';

export const bufferSchema = z.instanceof(Buffer).brand<'#GatewayBuffer'>();
