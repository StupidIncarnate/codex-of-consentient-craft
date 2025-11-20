/**
 * PURPOSE: Generates random bytes using crypto.randomBytes
 *
 * USAGE:
 * const bytes = cryptoRandomBytesAdapter({length: 4});
 * // Returns Buffer with random bytes
 */

import { randomBytes } from 'crypto';

export const cryptoRandomBytesAdapter = ({ length }: { length: number }): Buffer =>
  randomBytes(length);
