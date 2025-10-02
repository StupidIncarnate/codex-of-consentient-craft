import { randomBytes } from 'crypto';
import type { Buffer } from 'node:buffer';

export const cryptoRandomBytes = ({ size }: { size: number }): Buffer => {
  try {
    return randomBytes(size);
  } catch (error) {
    throw new Error(`Failed to generate random bytes of size ${size}`, { cause: error });
  }
};
