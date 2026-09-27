/**
 * PURPOSE: A real value round-tripped through `#gateway/browser/sessionStorage`'s own wrapped
 * global — writes a real entry then reads it back, so a caller stages a genuine `Storage` read
 * result rather than a hand-typed string.
 *
 * USAGE:
 * const value = SessionStorageItemStub({ key: 'draft', value: 'hello' });
 * // Returns 'hello', actually read back from the real sessionStorage
 */
import { sessionStorage } from './sessionStorage';

export const SessionStorageItemStub = ({
  key = 'gateway-stub-key',
  value = 'gateway-stub-value',
}: { key?: string; value?: string } = {}): string | null => {
  sessionStorage.setItem(key, value);
  return sessionStorage.getItem(key);
};
