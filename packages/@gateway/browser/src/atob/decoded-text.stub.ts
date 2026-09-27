/**
 * PURPOSE: A real decoded string, produced by actually calling `#gateway/browser/atob`'s own
 * wrapped global on a real base64 sample — for a caller that needs a genuine `atob` result rather
 * than a hand-typed one.
 *
 * USAGE:
 * const text = DecodedTextStub({ base64: 'aGVsbG8=' });
 * // Returns 'hello'
 */
import { atob } from './atob';

export const DecodedTextStub = ({ base64 = 'aGVsbG8=' }: { base64?: string } = {}): string =>
  atob(base64);
