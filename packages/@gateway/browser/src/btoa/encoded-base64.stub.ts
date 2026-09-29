/**
 * PURPOSE: A real base64 string, produced by actually calling `#gateway/browser/btoa`'s own
 * wrapped global on a sample — for a caller that needs a genuine `btoa` result rather than a
 * hand-typed one.
 *
 * USAGE:
 * const base64 = EncodedBase64Stub({ text: 'hello' });
 * // Returns 'aGVsbG8='
 */
import { btoa } from './btoa';

export const EncodedBase64Stub = ({ text = 'hello' }: { text?: string } = {}): string => btoa(text);
