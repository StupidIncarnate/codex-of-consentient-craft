/**
 * PURPOSE: A real UUID, minted by actually calling `#gateway/node/crypto`'s own re-exported
 * `randomUUID()` — for a caller that needs a genuine random id rather than a hand-typed one.
 *
 * USAGE:
 * const id = RandomUuidStub();
 * // Returns a real UUID string, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 */
import { randomUUID } from './crypto';

export const RandomUuidStub = (): string => randomUUID();
